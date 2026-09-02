import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

let cachedClient = null;

export function getBedrockClient() {
  if (cachedClient) return cachedClient;

  const awsRegion = process.env.AWS_REGION || "us-east-1";
  const clientConfig = {
    region: awsRegion,
  };

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  cachedClient = new BedrockRuntimeClient(clientConfig);
  return cachedClient;
}
