const normalizedDemoFlag = (process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA || '').trim().toLowerCase();

export function isDemoDataEnabled() {
  return normalizedDemoFlag === 'true';
}

export function getDemoDataInstructions() {
  return {
    envKey: 'NEXT_PUBLIC_ENABLE_DEMO_DATA',
    enabledValue: 'true',
    disabledValue: 'false',
  };
}