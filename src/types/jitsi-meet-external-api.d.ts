type ExternalJitsiMeetApiInstance = {
  dispose?: () => void;
  executeCommand?: (command: string, ...args: unknown[]) => void;
  addListener?: (eventName: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (eventName: string, listener: (...args: unknown[]) => void) => void;
};

type ExternalJitsiMeetApiConstructor = new (
  domain: string,
  options: {
    parentNode: HTMLElement;
    width?: string | number;
    height?: string | number;
    roomName: string;
    jwt?: string;
    userInfo?: {
      displayName?: string;
      email?: string;
    };
    configOverwrite?: Record<string, unknown>;
    interfaceConfigOverwrite?: Record<string, unknown>;
  },
) => ExternalJitsiMeetApiInstance;

declare global {
  interface Window {
    JitsiMeetExternalAPI?: ExternalJitsiMeetApiConstructor;
  }
}

export {};