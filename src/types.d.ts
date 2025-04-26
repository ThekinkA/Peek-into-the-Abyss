declare namespace API {
  interface NodeDistribution {
    country: string;
    city: string;
    longitude: number;
    latitude: number;
    ipCount: number;
  }

  interface TorProfile {
    IP: string;
    name: string;
    type: string;
    nikename: string;
    release_date: string;
    release_time: string;
    ORPort: string;
    DirPort: string;
    des_hash: string;
    fea_label: string;
    Tor_ver: string;
    protocol_ver: string;
    width_rec: string;
    status_state: string;
    status_reason: string;
    OS: string;
    microdesc: string;
  }

  interface ApiResponse<T> {
    success: boolean;
    data: T;
    errorMessage?: string;
  }
} 