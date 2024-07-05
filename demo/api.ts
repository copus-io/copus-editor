const API_HOST = 'https://api.test.copus.io/copus-client';

const token =
  'Bearer eyJhbGciOiJIUzI1NiJ9.eyJsYXN0TG9naW5UaW1lIjoxNzIwMDU3ODA1NzA2LCJzdWIiOiJoYW92ZWlAZ21haWwuY29tIiwiTGFzdFBhc3N3b3JkUmVzZXREYXRlIjoxNzE1NTgzNDg4MDI0LCJjcmVhdGVkIjoxNzIwMDU3ODA1NzE5LCJleHAiOjE3MjA2NjI2MDUsInVzZXJJZCI6NDE2fQ.xWI2LT18ZS8AfEfZEYKmRZxF5Q2lTg2Qbpm9HwxZb-w';

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
  const data = await res.json();
  console.log(data);
};
