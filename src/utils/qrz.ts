import { qrzService } from '../services/QRZService';
export { qrzService };
export const fetchQRZData = qrzService.lookupCallsign.bind(qrzService);
