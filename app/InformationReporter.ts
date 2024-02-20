
class InformationReporter<T>{
  private _info:T;

  private onupdate: (info:T) => void;

  constructor(information?:T, onupdate?: (info:T) => void ){
    this.onupdate = onupdate;
    this._info = information as T;
  }
  set info(value:T){
    this._info = value;
    this.onupdate(this._info);
  }
  get info():T{
    return this._info
  }
  public incrementNumber(key:string,value:number = 1){
    this._info[key] += value;
    this.onupdate(this._info);
  }
  public setString(key:string,value:string){
    this._info[key] = value;
    this.onupdate(this._info);
  }
}
export {InformationReporter}