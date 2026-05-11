$ErrorActionPreference = 'Stop'

$candidates = @(
  if ($env:PLATFORM_BASE_URL) { $env:PLATFORM_BASE_URL },
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
) | Where-Object { $_ }

$baseUrl = $null
foreach ($candidate in $candidates) {
  try {
    $response = Invoke-WebRequest -Uri "$candidate/en/login" -Method Get -MaximumRedirection 0
    if ($response.StatusCode -ge 200) {
      $baseUrl = $candidate
      break
    }
  } catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -in 200, 301, 302, 307, 308) {
      $baseUrl = $candidate
      break
    }
  }
}

if (-not $baseUrl) {
  throw 'No running app found on ports 3000 or 3001.'
}

$subjectsResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/subjects" -Method Get
$coursesResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/courses?locale=en&publishedOnly=false&limit=100" -Method Get

$subjects = @($subjectsResponse.subjects)
$courses = @($coursesResponse.courses)
if ($subjects.Count -eq 0) {
  throw 'No subjects returned by /api/v1/admin/subjects.'
}

$selectedCourse = $courses | Where-Object { $_.subject -and $_.subject.code } | Select-Object -First 1
$selectedSubject = if ($selectedCourse) {
  $subjects | Where-Object { $_.code.ToLower() -eq $selectedCourse.subject.code.ToLower() } | Select-Object -First 1
} else {
  $subjects | Select-Object -First 1
}

if (-not $selectedSubject) {
  throw 'Could not resolve a subject for validation.'
}

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$teacherPayload = @{
  firstName = 'Audit'
  lastName = 'Teacher'
  email = "audit.teacher.$timestamp@danesh.app"
  phone = '+989121234567'
  department = $null
  subjects = @()
  bio = 'Assignment verification script'
  status = 'active'
  locale = 'en'
} | ConvertTo-Json

$createdTeacher = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/teachers" -Method Post -ContentType 'application/json' -Body $teacherPayload
$teacherId = $createdTeacher.teacher.id
if (-not $teacherId) {
  throw 'Teacher creation did not return an id.'
}

try {
  $assignmentPayload = @{
    assignedSubjectCodes = @($selectedSubject.code)
    assignedCourseIds = @()
  }

  if ($selectedCourse) {
    $assignmentPayload.assignedCourseIds = @($selectedCourse.id)
  }

  $assignmentJson = $assignmentPayload | ConvertTo-Json
  Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/teachers/$teacherId/assignments" -Method Patch -ContentType 'application/json' -Body $assignmentJson | Out-Null
  $verification = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/teachers/$teacherId/assignments" -Method Get

  $subjectPersisted = @($verification.assignedSubjectCodes) -contains $selectedSubject.code
  $coursePersisted = if ($selectedCourse) { @($verification.assignedCourseIds) -contains $selectedCourse.id } else { $true }

  if (-not $subjectPersisted) {
    throw "Subject $($selectedSubject.code) was not persisted."
  }
  if (-not $coursePersisted) {
    throw "Course $($selectedCourse.title) was not persisted."
  }

  [PSCustomObject]@{
    BaseUrl = $baseUrl
    SubjectCount = $subjects.Count
    SelectedSubject = $selectedSubject.code
    SelectedCourse = if ($selectedCourse) { $selectedCourse.title } else { '(none selected)' }
    TeacherId = $teacherId
    AssignedSubjects = (@($verification.assignedSubjectCodes) -join ', ')
    AssignedCourses = (@($verification.assignedCourseIds) -join ', ')
    Result = 'PASS'
  } | ConvertTo-Json -Depth 4
}
finally {
  try {
    Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/teachers/$teacherId" -Method Delete | Out-Null
  } catch {
    Write-Warning "Cleanup failed for teacher $teacherId"
  }
}
