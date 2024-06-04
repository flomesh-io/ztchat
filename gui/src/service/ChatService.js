import { request } from './common/request';
import toast from "@/utils/toast";
import confirm from "@/utils/confirm";
export default class ChatService {
	getRooms(mesh) {
		return request(`/mock/api/meshes/${mesh}/rooms`);
	}
}
