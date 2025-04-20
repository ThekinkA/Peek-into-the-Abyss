import { request } from 'umi';

export async function getNodeDistribution() {
  return request<API.NodeDistribution[]>('/api/node/distribution');
}
