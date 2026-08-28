import {GameState} from './GameState';
import {SaveManager} from './SaveManager';
export class GameStore{
  state:GameState;
  constructor(public saveManager:SaveManager){this.state=saveManager.load()}
  save(){this.saveManager.save(this.state)}
  reset(preserveNgp=false){this.state=this.saveManager.reset();this.state.ngp=preserveNgp;this.save();return this.state}
}
