import myAxios from "@/request";

/** addUser POST /api/user/add */
export async function addUserUsingPost(
  body: API.UserAddDTO,
  options?: { [key: string]: any }
) {
  return myAxios<API.BaseResponseLong_>("/api/user/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** deleteUser POST /api/user/delete */
export async function deleteUserUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return myAxios<API.BaseResponseBoolean_>("/api/user/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** getUserById GET /api/user/get */
export async function getUserByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getUserByIdUsingGETParams,
  options?: { [key: string]: any }
) {
  return myAxios<API.BaseResponseUser_>("/api/user/get", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** getLoginUser GET /api/user/get/login */
export async function getLoginUserUsingGet(options?: { [key: string]: any }) {
  return myAxios<API.BaseResponseUserLoginVO_>("/api/user/get/login", {
    method: "GET",
    ...(options || {}),
  });
}

/** getUserVOById GET /api/user/get/vo */
export async function getUserVoByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getUserVOByIdUsingGETParams,
  options?: { [key: string]: any }
) {
  return myAxios<API.BaseResponseUserVO_>("/api/user/get/vo", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** userLogin POST /api/user/login */
export async function userLoginUsingPost(
  body: API.UserLoginDTO,
  options?: { [key: string]: any }
) {
  return myAxios<API.BaseResponseUserLoginVO_>("/api/user/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** userLogout POST /api/user/logout */
export async function userLogoutUsingPost(options?: { [key: string]: any }) {
  return myAxios<API.BaseResponseString_>("/api/user/logout", {
    method: "POST",
    ...(options || {}),
  });
}

/** listUserPageQuery POST /api/user/page */
export async function listUserPageQueryUsingPost(
  body: API.UserQueryDTO,
  options?: { [key: string]: any }
) {
  return myAxios<API.BaseResponsePageUserVO_>("/api/user/page", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** userRegister POST /api/user/register */
export async function userRegisterUsingPost(
  body: API.UserRegisterDTO,
  options?: { [key: string]: any }
) {
  return myAxios<API.BaseResponseLong_>("/api/user/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** updateUser POST /api/user/update */
export async function updateUserUsingPost(
  body: API.UserUpdateDTO,
  options?: { [key: string]: any }
) {
  return myAxios<API.BaseResponseBoolean_>("/api/user/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
