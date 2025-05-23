import {
  ProviderConfig, GetUserInfoRes, AuthorizeMethod,
  PostTokenByAuthCodeRes, PostTokenByRefreshTokenRes,
} from '@melody-auth/shared'

export const getAuthorize = async (
  {
    serverUri,
    clientId,
    scopes = [],
    redirectUri,
  }: ProviderConfig, {
    state,
    codeChallenge,
    locale,
    policy,
    org,
    authorizeMethod,
    authorizePopupHandler,
  }: {
  state: string;
  codeChallenge: string;
  authorizeMethod: AuthorizeMethod;
  authorizePopupHandler?: (data: { state: string; code: string }) => void;
  locale?: string;
  policy?: string;
  org?: string;
},
) => {
  const combinedScopes = scopes.map((scope) => scope.trim().toLowerCase());
  ['openid', 'profile', 'offline_access'].forEach((scope) => {
    if (!combinedScopes.includes(scope)) combinedScopes.push(scope)
  })
  const policyString = policy ? `&policy=${policy}` : ''
  const orgString = org ? `&org=${org}` : ''
  const url = serverUri +
    '/oauth2/v1/authorize?response_type=code&state=' +
    state +
    '&client_id=' +
    clientId +
    '&redirect_uri=' +
    redirectUri +
    '&code_challenge=' +
    codeChallenge +
    '&code_challenge_method=S256' +
    '&authorize_method=' +
    authorizeMethod +
    policyString + orgString +
    '&scope=' + combinedScopes.join(' ')

  const authUrlWithLocale = locale ? `${url}&locale=${locale}` : url

  if (authorizeMethod === 'popup') {
    const authWindow = window.open(
      authUrlWithLocale,
      'LoginPopup',
      'width=500,height=600,left=200,top=200',
    )

    if (authWindow) {
      authWindow.focus()
    }

    const onMessage = (event: MessageEvent) => {
      const data = event.data
      if (data && data.state && data.code) {
        if (authorizePopupHandler) {
          authorizePopupHandler(data)
        }

        if (authWindow && !authWindow.closed) {
          authWindow.close()
        }

        window.removeEventListener(
          'message',
          onMessage,
        )
      }
    }

    window.addEventListener(
      'message',
      onMessage,
    )
  } else {
    window.location.href = authUrlWithLocale
  }
}

export const getUserInfo = async (
  { serverUri }: ProviderConfig, { accessToken }: {
  accessToken: string;
},
) => {
  const url = `${serverUri}/oauth2/v1/userinfo`
  const res = await fetch(
    url,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
  }

  const data: GetUserInfoRes = await res.json()
  return data
}

export const postLogout = async (
  { serverUri }: ProviderConfig, {
    accessToken, refreshToken, postLogoutRedirectUri,
  }: {
  accessToken: string;
  refreshToken: string;
  postLogoutRedirectUri: string;
},
) => {
  const url = `${serverUri}/identity/v1/logout`
  const data = {
    refresh_token: refreshToken,
    post_logout_redirect_uri: postLogoutRedirectUri,
  }
  const urlEncodedData = new URLSearchParams(data).toString()

  const res = await fetch(
    url,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: urlEncodedData,
    },
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
  }

  const result = await res.json()
  return result?.redirectUri as string ?? postLogoutRedirectUri
}

export const postTokenByAuthCode = async (
  {
    serverUri,
    redirectUri,
  }: ProviderConfig, {
    code,
    codeVerifier,
  }: {
  code: string;
  codeVerifier: string;
},
) => {
  const url = `${serverUri}/oauth2/v1/token`
  const body = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  }
  const urlEncodedData = new URLSearchParams(body).toString()

  const res = await fetch(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: urlEncodedData,
    },
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
  }

  const data: PostTokenByAuthCodeRes = await res.json()
  return data
}

export const postTokenByRefreshToken = async (
  { serverUri }: ProviderConfig, { refreshToken }: {
  refreshToken: string;
},
) => {
  const url = `${serverUri}/oauth2/v1/token`
  const body = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  }
  const urlEncodedData = new URLSearchParams(body).toString()

  const res = await fetch(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: urlEncodedData,
    },
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
  }

  const data: PostTokenByRefreshTokenRes = await res.json()

  return data
}
