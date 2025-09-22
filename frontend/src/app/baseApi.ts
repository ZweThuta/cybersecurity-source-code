import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:4000/api',
  prepareHeaders: (headers) => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      const { token } = JSON.parse(storedAuth);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  },
  credentials: 'include',
});

const baseQueryWithReauth: typeof rawBaseQuery = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && (result.error as any).status === 401) {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      const parsed = JSON.parse(storedAuth);
      const user = parsed.user;
      const refreshToken = parsed.refreshToken;
      if (user?.id && refreshToken) {
        const refreshResult = await rawBaseQuery(
          {
            url: '/auth/refresh',
            method: 'POST',
            body: { userId: user.id, refreshToken },
          },
          api,
          extraOptions,
        );
        if (refreshResult.data) {
          const { accessToken, refreshToken: newRefresh } = refreshResult.data as any;
          const newAuth = { ...parsed, token: accessToken, refreshToken: newRefresh };
          localStorage.setItem('auth', JSON.stringify(newAuth));
          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          localStorage.removeItem('auth');
        }
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
});
