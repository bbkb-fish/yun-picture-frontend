import axios from "axios";
import { ElMessage } from "element-plus";

// 创建自定义实例
const request = axios.create({
  baseURL: "http://localhost:8123",
  timeout: 60000,
  withCredentials: true,
});

// 拦截器添加到自定义实例上
request.interceptors.request.use(function (config) {
  return config;
}, function (error) {
  return Promise.reject(error);
});

request.interceptors.response.use(function (response) {
  const { data } = response;
  if (data.code === 40100) {
    if (!response.config.url?.includes("user/get/login") &&
        !window.location.pathname.includes("/user/login")) {
      ElMessage.error("请先登录");
      window.location.href = `/user/login?redirect=${window.location.href}`;
    }
  }
  return response;
}, function (error) {
  return Promise.reject(error);
});

export default request;
export { request as myAxios };  // 兼容手动代码（import { myAxios }）
