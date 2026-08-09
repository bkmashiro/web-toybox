export { KendamaVoice } from './audio';
export {
  createKendamaState,
  getBallHole,
  getKendamaGeometry,
  releaseKendama,
  stepKendama,
} from './physics';
export type {
  Body2D,
  KendamaBounds,
  KendamaCatch,
  KendamaGeometry,
  KendamaInput,
  KendamaMode,
  RigidBall2D,
  KendamaState,
  Vec2,
} from './physics';
export {
  defineKendama,
  mountKendama,
  RetroKendamaElement,
} from './kendama';
export type { KendamaOptions } from './kendama';

import { defineKendama } from './kendama';
defineKendama();
