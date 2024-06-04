const message = {
  path: "message",
  name: "Message",
	redirect: "/message/list",
  children: [
		{
				path: '/message/list',
				name: 'message',
				component: () => import('@/views/message/MessageList.vue')
		},
  ],
};

export default message;
