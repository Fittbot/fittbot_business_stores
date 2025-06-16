export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      backendUrl: "https://app.fittbot.com",
      // backendUrl: "https://27b9-115-99-221-38.ngrok-free.app",
      backendPort: "8000",
      eas: {
        projectId: "ba5670ac-efd7-4f6b-a538-2db185d42d8f",
      },
    },
  };
};
