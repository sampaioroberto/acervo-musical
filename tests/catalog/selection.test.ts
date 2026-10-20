import {describe,it,expect} from 'vitest';
import {changeSelection,type SelectionState} from '../../src/catalog/selection';
const full:SelectionState={kind:'lyrics',ids:['1','2','3','4'],notice:null};
describe('selection',()=>{
 it('rejects fifth and duplicate entries',()=>{expect(changeSelection(full,{type:'add',id:'5'}).ids).toEqual(full.ids);expect(changeSelection(full,{type:'add',id:'1'}).ids).toEqual(full.ids)});
 it('reorders and removes without changing kind',()=>{expect(changeSelection(full,{type:'move',id:'4',toIndex:0}).ids).toEqual(['4','1','2','3']);expect(changeSelection(full,{type:'remove',id:'2'}).ids).toEqual(['1','3','4'])});
 it('requires confirmation to clear on kind change',()=>{expect(changeSelection(full,{type:'switch-kind',kind:'chords',confirmed:false})).toEqual(full);expect(changeSelection(full,{type:'switch-kind',kind:'chords',confirmed:true})).toEqual({kind:'chords',ids:[],notice:null})});
 it('ignores invalid reorder positions',()=>{expect(changeSelection(full,{type:'move',id:'3',toIndex:-1}).ids).toEqual(full.ids)});
});

