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

export async function getIpCounts() {
  return request<API.ApiResponse<{valid_after_time: string, ip_num: number}[]>>('/api/node/ip-counts');
}

export async function getCClassAliveData(originalIp: string) {
  return request<API.ApiResponse<API.CClassAliveData>>('/api/node/c-class-alive', {
    params: { originalIp },
  });
}

export async function getDefaultCClassAliveData() {
  return request<API.ApiResponse<API.CClassAliveData>>('/api/node/default-c-class-alive');
}

export async function getNodeCategoryStats() {
  return request<API.ApiResponse<{category: string, count: number}[]>>('/api/node/category-stats');
}

export async function getNodeCategoryDetails(category: string) {
  return request<API.ApiResponse<{
    IP: string;
    status: string;
    country: string;
    bandwidth: string;
  }[]>>('/api/node/category-details', {
    params: { category },
  });
}

export async function getNodeStatusStats() {
  return request<API.ApiResponse<{status: string, count: number}[]>>('/api/node/status-stats');
}
