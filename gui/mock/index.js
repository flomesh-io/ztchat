export default [
	{
		// get room list by mesh
		type: "get",
		url: "/api/meshes/:mesh/rooms",
		response: () => {
			return [{
				id: 1,
				target: {
					type: 'single',
					//value is endpoint id
					value: "fb4209bc-59d5-4129-a7d3-3b9452a732aa"
				},
				unread:2,
				last:{
					text:'Hey, how are you?',
					time: new Date().getTime()
				}
			},{
				id: 2,
				target: {
					type: 'group',
					//value is endpoint id
					value: ["fb4209bc-59d5-4129-a7d3-3b9452a732aa","fb4209bc-59d5-4129-a7d3-3b9452a732aa"]
				},
				unread:10,
				last:{
					// if not a text, [suffix name]
					text:'[txt]',
					time: new Date().getTime()
				}
			}]
		}
	},
	{
		// get room detail by room id
		type: "get",
		url: "/api/meshes/:mesh/rooms/:room",
		response: () => {
			return {
				id: 1,
				target: {
					type: 'single',
					//value is endpoint id
					value: "fb4209bc-59d5-4129-a7d3-3b9452a732aa"
				},
				history: [
					{	id:1,text:'Hey, how are you?', time: new Date().getTime(), endpoint:"fb4209bc-59d5-4129-a7d3-3b9452a732aa" },
					{	id:2,files:[{"src": "https://flomesh.io/img/flomesh.png", "type": "image"}], time: new Date().getTime(), endpoint:"fb4209bc-59d5-4129-a7d3-3b9452a732aa" },
					{	id:3,files:[{"src": "test.txt", "type": "any"}], time: new Date().getTime(), endpoint:"fb4209bc-59d5-4129-a7d3-3b9452a732aa" },
					{	id:4,text:'Seeking fulfillment and personal growth.', time: new Date().getTime(), endpoint:"fb4209bc-59d5-4129-a7d3-3b9452a732aa" },
				]
			}
		}
	},
	{
		// push message by room id
		type: "post",
		url: "/api/meshes/:mesh/rooms/:room/send",
		response: () => {
			/* if File or Image, need upload ref<File> */
			return {
				endpoint:"fb4209bc-59d5-4129-a7d3-3b9452a732aa",
				text: "Hey, how are you?", 
				time: new Date().getTime(),
				files: [{
					src: "data:image/gif;base64...",
					ref: null,//File{...}
					type: "image"
				},{
					src: "npm.txt",
					ref: null,//File{...}
					type: "any"
				}]
			}
		}
	},
	{
		// delete room by id
		type: "delete",
		url: "/api/meshes/:mesh/rooms/:room",
		response: () => {
			return true
		}
	},
	{
		// delete message by message id
		type: "delete",
		url: "/api/meshes/:mesh/rooms/:room/history/:id",
		response: () => {
			return true
		}
	},
	{
		// get files by room (manage files)
		type: "get",
		url: "/api/meshes/:mesh/rooms/:room/files",
		response: () => {
			return [
				{	id:2,files:[{"src": "https://flomesh.io/img/flomesh.png", "type": "image"}], time: new Date().getTime(), endpoint:"fb4209bc-59d5-4129-a7d3-3b9452a732aa" },
				{	id:2,files:[{"src": "test.txt", "type": "any"}], time: new Date().getTime(), endpoint:"fb4209bc-59d5-4129-a7d3-3b9452a732aa" },
			]
		}
	}
]