import helmet from "helmet";

const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

export default securityHeaders;
