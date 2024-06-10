import { mock } from './common/request';
import toast from "@/utils/toast";
import confirm from "@/utils/confirm";
export default class ChatService {
	getRooms(mesh) {
		return mock(`/api/meshes/${mesh}/rooms`);
	}
	getRoomDetail({mesh,room}) {
		return mock(`/api/meshes/${mesh}/rooms/${room}`);
	}
	sendMessage({
		mesh,
		room,
		body
	}) {
		return mock(`/api/meshes/${mesh}/rooms/${room}/send`,"POST",body);
	}
}
