<script setup>
import { ref, onMounted,onActivated,watch, computed } from "vue";
import { useStore } from 'vuex';
import Chat from "./Chat.vue"
import dayjs from 'dayjs';
import ChatService from '@/service/ChatService';
import EndpointDetail from '../mesh/EndpointDetail.vue'
import PipyProxyService from '@/service/PipyProxyService';
import relativeTime from 'dayjs/plugin/relativeTime';
import gptSvg from "@/assets/img/gpt.png";
dayjs.locale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s',
    s: 'just',
    m: '1 min',
    mm: '%d mins',
    h: '1 hour',
    hh: '%d hours',
    d: '1 day',
    dd: '%d days',
    M: '1 mth',
    MM: '%d mths',
    y: '1 year',
    yy: '%d years',
  }
});
dayjs.extend(relativeTime)
const store = useStore();
const chatService = new ChatService();
const pipyProxyService = new PipyProxyService();
const selectedMesh = computed(() => {
	return store.getters["account/selectedMesh"]
});
const aiRooms = [
	{
		id: 'gpt',
		name: 'Chat GPT',
		target: {
			type: 'gpt',
		},
		last:{
			text:'Hey, how are you?',
			time: new Date().getTime()
		}
	}
];
const rooms = ref(aiRooms);
onMounted(()=>{
	getEndpoints();
	loadrooms();
})
onActivated(()=>{
	getEndpoints();
	loadrooms();
})
const endpointMap = ref({});
const endpoints = ref([]);
const getEndpoints = () => {
	endpointMap.value = { 
		"a": { id:"a",name:"User A",username:"Tom",online:true } ,
		"b": { id:"b",name:"User B",username:"Jerry",online:true } ,
		"c": { id:"c",name:"User C",username:"Cat",online:false } ,
	};
	pipyProxyService.getEndpoints(selectedMesh.value?.name)
		.then(res => {
			res.forEach(ep=>{
				endpointMap.value[ep.id] = ep;
			});
			endpoints.value = res || [];
			endpoints.value.forEach((ep,ei)=>{
				ep.key = ep.id;
				ep.index = ei;
				ep.type = "ep";
				ep.label = `${ep?.name} (${ep?.username})`;
				ep.icon = "pi pi-user";
				ep.loading = false;
			});
		})
		.catch(err => console.log('Request Failed', err)); 
}

const loadrooms = () => {
	chatService.getRooms(selectedMesh.value?.name).then(res=>{
		rooms.value = aiRooms.concat(res);
	});
}

const handleFileUpload = (file) => {
}
const windowHeight = ref(window.innerHeight);
const viewHeight = computed(() => windowHeight.value - 45);
const timeago = computed(() => (ts) => {
	const date = new Date(ts);
	return dayjs(date).fromNow();
})
const selectRoom = ref();
const selectEp = ref();
const visibleEpSelect = ref(false);
const selectedNewChatEp = ref({});
const newChat = () => {
	const eps = Object.keys(selectedNewChatEp.value);
	const roomid = eps.join(",");
	const findroom = rooms.value.filter(room => room.id == roomid);
	if(!!findroom){
		selectRoom.value = findroom;
	} else {
		selectRoom.value = { ep: endpointMap.value[eps[0]] };
	}
	selectedNewChatEp.value = {};
	visibleEpSelect.value = false;
}
const openChat = (item) => {
	selectRoom.value = null;
	setTimeout(()=>{
		selectRoom.value = {
			...item,
			name:item.target?.type=='single'?`${endpointMap.value[item.target?.ep].name} (${endpointMap.value[item.target?.ep].username})`:item.name
		}
	},100)
}
</script>

<template>
	<div class="flex flex-row">
		<div :class="{'w-22rem':!!selectRoom,'w-full':!selectRoom,'mobile-hidden':!!selectRoom}">
				
		<AppHeader :main="true">
				<template #center>
					<b>Message (32)</b>
				</template>
		
				<template #end> 
					<Button icon="pi pi-plus"  @click="visibleEpSelect = true" />
				</template>
		</AppHeader>
		<Dialog class="noheader" v-model:visible="visibleEpSelect" modal header="New chat" :style="{ width: '25rem' }">
				<AppHeader :back="() => visibleEpSelect = false" :main="false">
						<template #center>
							<b>New Chat<Badge class="ml-2 relative" style="top:-2px" v-if="Object.keys(selectedNewChatEp).length>0" :value="Object.keys(selectedNewChatEp).length"/></b>
						</template>
				
						<template #end> 
							<Button icon="pi pi-check" @click="newChat" :disabled="Object.keys(selectedNewChatEp).length==0"/>
						</template>
				</AppHeader>
				<Tree :filter="true" filterMode="lenient" v-model:selectionKeys="selectedNewChatEp" :value="endpoints" selectionMode="checkbox" class="w-full md:w-[30rem]">
					<template #nodeicon="slotProps">
							<Avatar icon="pi pi-user" size="small" style="background-color: #ece9fc; color: #2a1261" />
					</template>
					<template #default="slotProps">
							<b class="px-2">{{ slotProps.node.label }}</b>
					</template>
				</Tree>
		</Dialog>
		<DataView class="message-list" :value="rooms">
		    <template #list="slotProps">
		        <div @click="openChat(item)" class="flex flex-col message-item pointer" v-for="(item, index) in slotProps.items" :key="index">
							<div class="flex flex-col py-3 px-3 gap-4 w-full" :class="{ 'border-t border-surface-200 dark:border-surface-700': index !== 0 }">
									<div class="md:w-40 relative">
										<Badge v-if="item.unread>0" :value="item.unread" severity="danger" class="absolute" style="right: -10px;top:-10px"/>
										<img v-if="item.id=='gpt'" :src="gptSvg" width="42" height="42" />
										<Avatar v-else-if="item.target?.type == 'group'" icon="pi pi-users" size="large" style="background-color: #ece9fc; color: #2a1261" />
										<Avatar v-else icon="pi pi-user" size="large" style="background-color: #ece9fc; color: #2a1261" />
										
									</div>
									<div class="flex-item">
											<div class="flex" v-if="item.target?.type == 'single'">
												<div class="flex-item" v-if="endpointMap[item.target?.ep||item.target?.eps[0]]">
													<b>{{endpointMap[item.target?.ep||item.target?.eps[0]].name}} ({{endpointMap[item.target?.ep||item.target?.eps[0]].username}})</b>
												</div>
												<Status :run="true" style="top: 7px;margin-right: 0;right: -10px;"/>
											</div>
											<div class="flex" v-else>
												<div class="flex-item" >
													<b>{{item.name}}</b>
												</div>
											</div>
											<div class="flex mt-1">
												<div class="flex-item" >
													<div class="w-10rem text-ellipsis">{{item.last?.text}}</div>
												</div>
												<div class="w-3rem text-right text-tip opacity-60" >
													{{timeago(item.last?.time)}}
												</div>
											</div>
									</div>
							</div>
		        </div>
		    </template>
		</DataView>
		</div>
		<div class="flex-item" v-if="!!selectEp">
			<div class="shadow mobile-fixed">
				<EndpointDetail @back="() => selectEp=false" :ep="selectEp"/>
			</div>
		</div>
		<div v-else-if="selectRoom" class="flex-item">
			<div class="shadow mobile-fixed" >
				<Chat :endpointMap="endpointMap" :room="selectRoom" @back="() => selectRoom=false" @ep="(ep) => selectEp = ep"/>
			</div>
		</div>
	</div>
</template>

<style lang="scss">
	
</style>