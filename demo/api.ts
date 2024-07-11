const API_HOST = 'https://api.test.copus.io/copus-client';

const token =
  'Bearer eyJhbGciOiJIUzI1NiJ9.eyJsYXN0TG9naW5UaW1lIjoxNzIwNzA4MDk1MzIzLCJzdWIiOiJoYW92ZWlAZ21haWwuY29tIiwiTGFzdFBhc3N3b3JkUmVzZXREYXRlIjoxNzE1NTgzNDg4MDI0LCJjcmVhdGVkIjoxNzIwNzA4MDk1MzQyLCJleHAiOjE3MjEzMTI4OTUsInVzZXJJZCI6NDE2fQ._aidTbs0qzTpVyn1v8TgH079V58aMw855q2-NNF0zOw';

// 获取 markList
export const getMarkList = async (opusUuid) => {
  const res = await fetch(`${API_HOST}/client/common/opus/markList?opusUuid=${opusUuid}`);
  const json = await res.json();
  return json.data ?? [];
};

// 添加 mark
export const addMark = async (params) => {
  const res = await fetch(`${API_HOST}/client/user/opus/link/mark`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify(params),
  });
  const jsonRes = await res.json();
  return jsonRes;
};
