import { buildMatchContext } from './app/lib/footballData.js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

buildMatchContext('South Africa', 'Korea Republic').then(res => {
  console.log(res);
}).catch(console.error);
