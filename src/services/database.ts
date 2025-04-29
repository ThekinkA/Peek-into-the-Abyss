import { request } from 'umi';

export async function getNodeDistribution() {
  return request<API.ApiResponse<API.NodeDistribution[]>>('/api/node/distribution');
}

export async function getTorProfile() {
  return request<API.ApiResponse<API.TorProfile[]>>('/api/node/torprofile');
}

export async function getLatestIPs() {
  return request<API.ApiResponse<string[]>>('/api/node/latest-ips');
}

export async function getLatestTime() {
  return request<API.ApiResponse<string>>('/api/node/latest-time');
}
