import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { getLoginUserUsingGet } from "@/services/api/userController";

/**
 * 登录用户信息
 */
export const useLoginUserStore = defineStore("loginUser", () => {
  const loginUser = ref<API.UserLoginVO>({
    userName: "未登录",
    id: -1
  });
  async function fetchLoginUser() {
    // 获取当前登录的用户
    const res = await getLoginUserUsingGet();
    if (res.data.code === 0 && res.data.data) {
      loginUser.value = res.data.data
    }
  }

  function setLoginUser(newLoginUser: any) {
    loginUser.value = newLoginUser;
  }

  return { loginUser, fetchLoginUser, setLoginUser };
});
