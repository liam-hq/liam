export const initialNodes = [
  {
    id: "user",
    type: "entity",
    position: { x: 100, y: 100 },
    data: {
      label: "User",
      fields: [
        { name: "id", type: "int", isPrimary: true, isForeign: false },
        { name: "username", type: "varchar(50)", isPrimary: false, isForeign: false },
        { name: "email", type: "varchar(100)", isPrimary: false, isForeign: false },
        { name: "created_at", type: "timestamp", isPrimary: false, isForeign: false },
      ],
      onStartEntityChat: () => {}, // ダミー関数を追加
    },
  },
  {
    id: "post",
    type: "entity",
    position: { x: 500, y: 100 },
    data: {
      label: "Post",
      fields: [
        { name: "id", type: "int", isPrimary: true, isForeign: false },
        { name: "user_id", type: "int", isPrimary: false, isForeign: true },
        { name: "title", type: "varchar(200)", isPrimary: false, isForeign: false },
        { name: "content", type: "text", isPrimary: false, isForeign: false },
        { name: "created_at", type: "timestamp", isPrimary: false, isForeign: false },
      ],
      onStartEntityChat: () => {}, // ダミー関数を追加
    },
  },
]

export const initialEdges = [
  {
    id: "user-post",
    source: "user",
    target: "post",
    label: "1:N",
    type: "smoothstep",
    animated: true,
  },
]
