<script setup>
import { ref, onMounted,onActivated,watch, computed } from "vue";
import ChatService from '@/service/ChatService';
import { useStore } from 'vuex';
import 'deep-chat';
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
const emits = defineEmits(['back']);
const props = defineProps(['target','pid']);
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
		//post initialMessages.value.push(e.detail.message)
		console.log(e.detail.message)
	}
}
const loaddata = () => {
	const _initialMessages = [];
	if(!!props.target?.pid){
		chatService.getRoomDetail({
			mesh: selectedMesh.value?.name,
			room: props.target?.pid
		}).then(res=>{
			if(!!chatReady.value){
				chat.value.clearMessages();
			}
			if(res.history){
				res.history.forEach(msg=>{
					// alert(2)
					_initialMessages.push({
						...msg,
						"role": msg.endpoint == selectedMesh.value?.agent?.id ? 'user' : 'ai'
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
watch(()=>props.target,()=>{
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
</script>

<template>
	<AppHeader :back="back">
	    <template #center v-if="props.target?.ep">
				<Status :run="props.target.ep?.online" />
	      <b>{{props.target.ep?.name}} ({{props.target.ep?.username}})</b>
	    </template>
	
	    <template #end> 
				<Button icon="pi pi-print" class="mr-2" severity="secondary" text />
				<Button icon="pi pi-user" severity="secondary" text />
			</template>
	</AppHeader>
	<div style="width: 100%;height: calc(100vh - 37px);flex: 1;margin: 0;display: flex;flex-direction: column;">
	<deep-chat
		:textToSpeech='{"volume": 0.9}'
		ref="chat"
		@render="chatRender"
		@new-message="sendMessage"
		:attachmentContainerStyle='{
			"backgroundColor": "rgba(230,230,230,0.5)","top": "-45px"
		}'
		:dragAndDrop='{"backgroundColor": "#80ff704d", "border": "5px dashed #52c360"}'
		style="width: 100%;flex: 1;border: none"
		:style="{'height': `${viewHeight}px`}"
	  v-model:initialMessages="initialMessages"
		:messageStyles='{
			"default": {
				"user": {"bubble": {"backgroundColor": "#9855f7"}}
		}}'
		:avatars="true"
		:inputAreaStyle='{"backgroundColor": "#F4F6F7"}'
		:textInput="inputStyle"
		auxiliaryStyle="
			::-webkit-scrollbar-thumb {
				background-color: #9855f7;
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
		:demo="true"
		:stream="true"
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