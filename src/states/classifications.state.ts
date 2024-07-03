import { IClassification } from '@/interfaces/classification.model';
import { atom } from 'jotai';

export const classificationsState = atom<IClassification[]>([]);
