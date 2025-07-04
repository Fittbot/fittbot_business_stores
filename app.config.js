export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      backendUrl: "https://app.fittbot.com",
      // backendUrl:
      //   "https://f394-2409-408d-4e8a-15a4-6df6-4c85-7bd5-1cc2.ngrok-free.app",
      backendPort: "8000",
      eas: {
        projectId: "ba5670ac-efd7-4f6b-a538-2db185d42d8f",
      },
    },
  };
};
