import { request } from 'umi';

export interface CClassAliveData {
  id: number;
  original_ip: string;
  alive_count: number;
  dead_count: number;
  host1: string;
  host2: string;
  host3: string;
  host4: string;
  host5: string;
}

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
  return request<API.ApiResponse<CClassAliveData>>('/api/node/c-class-alive', {
    params: { originalIp },
  });
}

export async function getDefaultCClassAliveData() {
  return request<API.ApiResponse<CClassAliveData>>('/api/node/default-c-class-alive');
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

export async function getTopFiveCountries() {
  return request<API.ApiResponse<{country: string, count: number}[]>>('/api/node/top-five-countries');
}

export async function getNodeStatusTimeSeries() {
  return request<API.ApiResponse<{
    time: string;
    up: number;
    down: number;
    unknown: number;
  }[]>>('/api/node/status-time-series');
}

export async function getVulnerabilityStats() {
  return request<API.ApiResponse<{vulnerability_CVE: string, count: number}[]>>('/api/node/vulnerability-stats');
}

export async function getVulnerabilityDetails(cve: string) {
  return request<API.ApiResponse<{
    vulnerability_CVE: string;
    /*数据库中暂时缺少相关数据*/
    description: string;
    severity: string;
    affected_versions: string;
    fix_version: string;
  }>>('/api/node/vulnerability-details', {
    params: { cve },
  });
}

export async function getCountryDistribution() {
  return request<API.ApiResponse<{
    name: string;
    value: number;
  }[]>>('/api/node/country-distribution');
}

export async function getIPList() {
  return request<API.ApiResponse<{label: string, value: string}[]>>('/api/node/ip-list');
}

export async function getPortInfo(ip: string) {
  return request<API.ApiResponse<{
    port: number;
    state: string;
    reason: string;
    name: string;
    product: string;
    version: string;
    extra: string;
    conf: string;
    cpe: string;
  }[]>>('/api/node/port-info', {
    params: { ip },
  });
}

export async function getNodeAliveStats() {
  return request<API.ApiResponse<{
    time: string;
    true_count: number;
    false_count: number;
  }[]>>('/api/node/alive-stats');
}

export async function getLatestNodeAliveRatio() {
  return request<API.ApiResponse<{
    true_count: number;
    false_count: number;
  }>>('/api/node/latest-alive-ratio');
}
