import type { MaskId, ObservationId, RelationId, ResidueId, SceneId } from '../core/GameState';

export const MASK_LABELS: Record<MaskId, string> = {
  mayor: '奥斯文 · 鼻梁残响',
  butcher: '格伦 · 嘴唇残响',
  elaine: '伊莲 · 耳朵残响',
  milo: '米罗 · 眼睛残响',
  postman: '埃利亚斯 · 眉毛残响',
};

export const RESIDUE_LABELS: Record<ResidueId, string> = {
  discern: '辨 · 鼻梁',
  speech: '言 · 嘴唇',
  hear: '听 · 耳朵',
  see: '见 · 眼睛',
  act: '行 · 眉毛',
  warm: '温 · 脸颊',
  blank: '未定形 · 透明残响',
};

export const MASK_RESIDUES: Record<MaskId, ResidueId> = {
  mayor: 'discern',
  butcher: 'speech',
  elaine: 'hear',
  milo: 'see',
  postman: 'act',
};

export const OBSERVATIONS: Record<ObservationId, { title: string; text: string }> = {
  'box-relations': { title: '上锁木盒', text: '三张试面合拢、台灯熄灭以后，高处露出一把旧钥匙；木盒中只有一张旧拓片与一团磨损的线，后室仍缺最后一件材料。' },
  'clock-exception': { title: '水底记忆', text: '房间都在倒流，只有墙钟没有服从倒流。' },
  'mayor-contradiction': { title: '两个半房间', text: '公开话术与私人痕迹并不总能同时成立。' },
  'butcher-care': { title: '第七把椅子', text: '格伦的分类不是为了效率；他记住了每一个将被告别的对象。' },
  'elaine-habit': { title: '镜片后台', text: '不同年龄的脸改变了，几个无意识动作却一直重复。' },
  'milo-projection': { title: '怪物世界', text: '孩子画出的怪物没有改变家具的位置，只改变了对人的解释。' },
  'postman-break': { title: '第七步', text: '第六步之后逆行不会重置；循环要求人继续向前。' },
  'soren-space': { title: '回声房间', text: '空间可以不依赖脸而被确认；距离、材质与回声仍然稳定。' },
  'blank-choice': { title: '给自己的空白', text: '没有一个物件被宣布为正确。选择发生时，空间才稳定下来。' },
  'shop-memory': { title: '铺子记得', text: '熟悉的木头在不同面具之后留下了不属于装饰的变化。' },
};

export const RELATIONS: Record<RelationId, { pair: [ObservationId, ObservationId]; text: string }> = {
  'see-discern': { pair: ['milo-projection', 'mayor-contradiction'], text: '存在“看见”与“辨别”的互证关系。' },
  'hear-act': { pair: ['elaine-habit', 'postman-break'], text: '存在“习惯”与“主动打破节律”的互证关系。' },
  'speech-warm': { pair: ['butcher-care', 'soren-space'], text: '存在“表达”与“在场”的互证关系。' },
};

export const SCENE_TITLES: Record<SceneId, string> = {
  shop: '面具铺', secret: '后室', water: '水底记忆', mayor: '两个半房间', butcher: '第七把椅子',
  elaine: '镜片后台', milo: '怪物世界', postman: '第七步', soren: '回声房间', blank: '给自己的空白',
  finale: '三站共振', ending: '最后一张脸',
};

export const HINTS: Record<SceneId, [string, string, string]> = {
  shop: ['先听听木偶，再观察哪几张旧面具还没有“收好”。', '把三张仍张着嘴的试面合上；随后熄灯，留意高处会出现什么。', '把矮凳挪到钥匙下面，取下钥匙后在物品栏选中它，再打开木盒。'],
  secret: ['先别盯工作台：八只玻璃罐里有一只塞口被磨得异常发白，先把它打开。', '薄面壳落到桌上以后，木盒带来的拓片和旧线都能直接拖动；左侧棉布下面还压着第三件东西。', '按物件留下的磨痕完成工艺：拓片先压出轮廓，旧线再沿针孔收紧，最后把票根推进下颌夹缝。'],
  water: ['先问：房间里哪一样东西没有倒流？', '不要按按钮让时间反转，直接抓住钟针。', '逆时针拖动分针到接近一整圈，再擦掉镜面雾气。'],
  mayor: ['别急着读六张纸。先摸讲台下层、玻璃城模、两幅墙框、肖像背板和花盆，房间会把证据自己露出来。', '发现后的六块证据牌可以拖到讲台铜夹；要找的是公开说法与房间痕迹彼此不冲突的三块。', '夹住“账簿”“码头”“补助”三块；讲台前板打开后，再取走里面真正浮出的鼻梁残响。'],
  butcher: ['先碰左墙、吊灯、农场画和六只猪本身。它们会用动作重复格伦记下的习惯，不必先读一整页规则。', '托盘上的六块木牌用图案区分：荆棘、燕麦、白奶、土豆、胡萝卜、黑麦。把它们拖到会接受自己的座位。', '从左到右依次为荆棘、燕麦、白奶、土豆、胡萝卜、黑麦；随后把第七把椅子向自己拉开，再打开被椅背挡住的窄抽屉。'],
  elaine: ['镜子被雾住了，碎片本身才保留后台动作。', '碎片可拖动；轻点选中后再点一次、按钮或滚轮都能旋转九十度。', '把十二块真实镜面碎片拼回中央网格，最终每片都保持正向；靠近正确位置会吸附。'],
  milo: ['怪物和现实共用同一套坐标；先反复切换一次看法。', '白天能看清拐杖、湿布和徽章留下的生活痕迹；怪物视角才会把它们对应到三种解释。', '把旧拐杖拖到门边的牛头父亲、湿布拖到床边的猫首母亲、徽章拖到台灯旁的蛇身镇长。'],
  postman: ['循环不是路的属性，而是“继续按原节奏走”的属性。', '注意第六步与第七步之间发生了什么。', '走到第六步后转身，再倒退一步。'],
  soren: ['先让钟响一次，听清楚哪边比别处多回来一声。', '钟响过以后，点一下索伦靠在左墙的手杖，再拿它去敲不同位置的石墙。', '右侧偏深的位置会出现双重回声，连续确认几处后夹层会松开。'],
  blank: ['这一次没有标准答案；桌上的三件实物都能查看。', '先点一件你愿意留下的东西，再看看白面具会不会接受它。', '选择照片、工作册或怀表中的任意一件，再点击中央白面具即可。三者不会改变终章正确与否。'],
  finale: ['三座机器的两个槽位都画着对应的脸部轮廓，先把此前得到的残响放到最像它们的位置。', '配对正确以后，每台都会再露出一个可以直接操作的机械部件。', '复写镜=见+辨；节律槽=听+行；温声台=言+温。透明残响最终要去没有标签的空位。'],
  ending: ['选择不是按钮。', '你要用手完成一种离开的动作。', '镜前拖入半张脸 / 一根根拔线 / 摘下面具并关灯，任一条都能完成结局。'],
};
