import { myAxios } from "@/request";

/** health GET /api/health */
export async function healthUsingGet(options?: { [key: string]: any }) {
  return myAxios<API.BaseResponseString_>("/api/health", {
    method: "GET",
    ...(options || {}),
  });
}
