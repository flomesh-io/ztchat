<script setup>
import { ref, onMounted,onActivated,watch, computed } from "vue";
import ChatService from '@/service/ChatService';
import { useStore } from 'vuex';
import 'deep-chat';
import gptSvg from "@/assets/img/gpt.png";
import userSvg from "@/assets/img/user.png";
/*
	{"files": [{
		src: "data:image/gif;base64...",
		ref: File{...}
		type: "image"
	},{
		src: "npm.txt",
		ref: File{...}
		type: "any"
	}], "role": "ai"},
*/
const emits = defineEmits(['back','ep']);
const props = defineProps(['room','endpointMap']);
const store = useStore();
const chatService = new ChatService();
const initialMessages = ref([]);
const selectedMesh = computed(() => {
	return store.getters["account/selectedMesh"]
});

const chat = ref(null);
const chatReady = ref(false)
const chatRender = (e)=>{
	chat.value.scrollToBottom();
	chat.value.focusInput();
	if(!chatReady.value){
		chatReady.value = true;
		loaddata();
	}
}
const sendMessage = (e) => {
	if(!e.detail.isInitial){
		initialMessages.value.push(e.detail.message)
		console.log(e.detail.message)
	}
}
const getRole = (ep) => {
	switch (ep){
		case selectedMesh.value?.agent?.id:
			return 'user';
		case 'gpt':
			return 'ai';
		default:
			return ep;
	}
}
const loaddata = () => {
	const _initialMessages = [];
	if(!!props.room?.id){
		chatService.getRoomDetail({
			mesh: selectedMesh.value?.name,
			room: props.room?.id
		}).then(res=>{
			if(!!chatReady.value){
				chat.value.clearMessages();
			}
			if(res.history){
				res.history.forEach(msg=>{
					_initialMessages.push({
						...msg,
						"role": getRole(msg.endpoint)
					})
				})
			}
			if(!!chatReady.value){
				initialMessages.value = _initialMessages;
				chat.value.refreshMessages();
			}
		});
	} else {
		if(!!chatReady.value){
			chat.value.clearMessages();
			initialMessages.value = [];
			chat.value.refreshMessages();
		}
		
	}
}
watch(()=>props.room,()=>{
	loaddata()
},{
	deep:true,
	immediate:false,
})
const handleFileUpload = (file) => {
}
const windowHeight = ref(window.innerHeight);
const viewHeight = computed(() => windowHeight.value - 36);

const back = () => {
	emits('back')
}
const top = "13px";
const iconwidth = "2.2em";
const svgwidth = "1.3em";
const submitStyle = computed(() => (position, space)=>{
	return {
		position,
		"submit": {
			"container": {
				"default": {
					top,
					"left": (position=='inside-left' || position=='outside-left') ? space : 'auto',
					"right": (position=='inside-right' || position=='outside-right') ? space : 'auto',
					"width": iconwidth,
					"height": iconwidth,
					"borderRadius": "25px",
					
				},
				"hover": {"backgroundColor": "#f4f3ff","boxShadow": "0px 0.3px 0.9px rgba(0, 0, 0, 0.12), 0px 1.6px 3.6px rgba(0, 0, 0, 0.16)"},
				"click": {"backgroundColor": "#f4f3ff","boxShadow": "0px 0.3px 0.9px rgba(0, 0, 0, 0.12), 0px 1.6px 3.6px rgba(0, 0, 0, 0.16)"}
			},
			"svg": {
				"styles": {
					"default": {
						"fontSize": svgwidth,
					}
				}
			}
				
		}
	}
})
const micStyle= computed(()=>(position, space)=>{
	return {
		"button": {
			"default": {
				"container": {"default": {
					top,
					"left": (position=='inside-left' || position=='outside-left') ? space : 'auto',
					"right": (position=='inside-right' || position=='outside-right') ? space : 'auto',
					"borderRadius": "20px", "width": iconwidth, "height": iconwidth}},
				"svg": {"styles": {"default": {"fontSize": svgwidth}}}
			},
			position
		}
	}
})
const menuStyle = computed(()=>(position, space)=>{
	return {
		"button": {
			position,
			"styles": {
				"container": {
					"default": {
						top,
						"left": (position=='inside-left' || position=='outside-left') ? space : 'auto',
						"right": (position=='inside-right' || position=='outside-right') ? space : 'auto',
						"width": iconwidth,
						"height": iconwidth,
					},
					"hover": {"backgroundColor": "#f4f3ff"},
					"click": {"backgroundColor": "#f7edff"}
				},
				"svg": {"styles": {"default": {"fontSize": svgwidth}}}
			}
		}
	}
})
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value<=768);
const inputStyle = computed(() => {
	return {
		"styles": {
			"container": {
				"width": "100%",
				"margin": "0",
				"border": "unset",
				"wordBreak": "break-all",
				"borderTop": "1px solid #d5d5d5",
				"borderRadius": "0px",
				"boxShadow": "unset"
			},
			"text": {
				"fontSize": "1.05em",
				"paddingTop": "50px",
				"minHeight":!!isMobile.value?"":"100px",
				"paddingBottom": "13px",
				"paddingLeft": "12px",
				"paddingRight": "2.4em"
			}
		},
		"placeholder": {"text": "Type a message...", "style": {"color": "#bcbcbc"}}
	}
})
const hasMediaDevices = computed(() => !!navigator.mediaDevices);
const openEp = () => {
	emits('ep',props.room?.target?.ep);
}
const request = ref({
	handler: (body, signals) => {
		try {
			if(body?.messages[0]){
				chatService.sendMessage({
					mesh: selectedMesh.value?.name,
					room: props.room?.id,
					body: {
						...body?.messages[0],
						endpoint: props.room?.target?.ep,
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
				}).then(res=>{
					signals.onResponse({...body?.messages[0],overwrite: true});
				});
			}else{
				
				signals.onResponse({error: 'No message'});
			}
		} catch (e) {
			signals.onResponse({error: 'Error'}); // displays an error message
		}
	}
})

const avatarStyle = {"avatar":{"position":"relative","width": "30px","height": "30px"}};
const avatars = computed(() => {
	const rtn = {
	}
	
	initialMessages.value.forEach((_message) => {
		rtn[_message.role] = {
			"src": userSvg, 
			"styles":avatarStyle
		}
	})
	rtn.ai = {"src": gptSvg,"styles":avatarStyle};
	rtn.user = {"src": userSvg,"styles":avatarStyle};
	return rtn;
})

const messageStyles = computed(() => {
	const rtn = {
		"default": {}
	}
	initialMessages.value.forEach((_message) => {
		rtn.default[_message.role] = {
			"bubble": {"backgroundColor": "#f5f5f5","marginTop":"30px"},
		}
	})
	rtn.default.ai = {"bubble": {"backgroundColor": "#f5f5f5","marginTop":"30px"}};
	rtn.default.user = {"bubble": {"backgroundColor": "#9855f7","marginTop":"30px"}};
	return rtn
})
const names = computed(() => {
	let rtn = {}
	initialMessages.value.forEach((_message) => {
		rtn[_message.role] = {
			"text": props.endpointMap[_message.role]?.name || _message.role,
			"style": {"position":"relative","width": "0","whiteSpace":"nowrap","wordBreak":"keep-all", "marginTop": "10px", "fontSize": "12px","left": "10px"}
		}
	})
	rtn.ai = {
		"text": "GPT",
		"style": {"position":"relative","width": "0","whiteSpace":"nowrap","wordBreak":"keep-all", "marginTop": "10px", "fontSize": "12px","left": "10px"}
	};
	rtn.user = {
		"text": props.endpointMap[selectedMesh.value?.agent?.id]?.name,
		"style": {"position":"relative","width": "0","whiteSpace":"nowrap","wordBreak":"keep-all", "marginTop": "10px", "fontSize": "12px","right": "40px"}
	};
	return rtn
	
})
</script>

<template>
	<AppHeader :back="back">
	    <template #center v-if="props.room?.target?.type=='single'">
				<Status :run="props.room?.target.ep?.online" />
	      <b>{{props.room?.name}}</b>
	    </template>
	    <template #center v-else>
	      <b>{{props.room?.name}}</b>
	    </template>
	
	    <template #end> 
				<Button icon="pi pi-print" class="mr-2" severity="secondary" text />
				<Button icon="pi pi-user" @click="openEp" severity="secondary" text />
			</template>
	</AppHeader>
	<div style="width: 100%;height: calc(100vh - 37px);flex: 1;margin: 0;display: flex;flex-direction: column;">
	<deep-chat
		:textToSpeech='{"volume": 0.9}'
		ref="chat"
		:names="names"
		@render="chatRender"
		@new-message="sendMessage"
		:attachmentContainerStyle='{
			"backgroundColor": "rgba(230,230,230,0.5)","top": "-45px"
		}'
		
		:avatars='avatars'
		:dragAndDrop='{"backgroundColor": "#80ff704d", "border": "5px dashed #52c360"}'
		style="width: 100%;flex: 1;border: none"
		:style="{'height': `${viewHeight}px`}"
	  v-model:initialMessages="initialMessages"
		:displayLoadingBubble="false"
		:messageStyles='messageStyles'
		:inputAreaStyle='{"backgroundColor": "#F4F6F7"}'
		:textInput="inputStyle"
		auxiliaryStyle="
			::-webkit-scrollbar-thumb {
				background-color: #f5f5f5;
		}"
		:dropupStyles='false?false:{
			"button": {
				"position": "inside-left",
				"styles": {
					"container": {
						"default": {
							"position": "absolute",
							"top": "-40px",
							"width": "2.2em",
							"height": "2.2em",
						},
						"hover": {"backgroundColor": "#f4f3ff"},
						"click": {"backgroundColor": "#f7edff"}
					},
					"svg": {"styles": {"default": {"fontSize": "1.3em"}}}
				}
			},
			"menu": {
				"container": {
					"boxShadow": "#e2e2e2 0px 1px 3px 2px"
				},
				"item": {
					"hover": {
						"backgroundColor": "#f4f3ff"
					},
					"click": {
						"backgroundColor": "#f4f3ff"
					}
				},
				"iconContainer": {
					"width": "1.8em"
				},
				"text": {
					"fontSize": "1.05em"
				}
			}
		}'
		:demo='{"displayLoadingBubble": false}'
		:stream="false"
		:request="props.room?.id=='gpt'?null:request"
		:submitButtonStyles="submitStyle('inside-right','10px')"
		:microphone="hasMediaDevices?micStyle('inside-right','40px'):false"
		:mixedFiles="menuStyle('inside-left','40px')"
		:images="menuStyle('inside-left','10px')"
		:camera="hasMediaDevices?menuStyle('inside-left','70px'):false"
	  />
	</div>
</template>

<style lang="scss">
	
	#container{
		height: 100%;
	}
	.outside-left{
		bottom: 1em !important;
	}
</style>