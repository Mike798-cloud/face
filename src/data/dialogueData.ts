export interface WorldDialogue {
  readonly voiceId: string;
  readonly zh: string;
  readonly en: string;
}

/**
 * Diegetic lines: characters speak about what they want, remember or fear.
 * They are intentionally not procedural instructions and never name the puzzle solution.
 */
export const WORLD_DIALOGUE = {
  shopDoll: {
    voiceId: 'dialogue-shop-doll',
    zh: '师父打烊前总会熄灯，再把矮凳挪回墙边。昨晚两样都没做，连那些旧面具都像陪着灯睁了一夜的眼。',
    en: 'Before closing, the master always put out the lamp and pushed the stool back to the wall. Last night he did neither; even the old masks seemed to keep their eyes open beside the light all night.',
  },
  mayor: {
    voiceId: 'dialogue-mayor',
    zh: '他们把我的话抄得很整齐。可我自己已经分不清，哪一句是说给镇上的，哪一句只是说给镜子里的那个人。',
    en: 'They copied my words neatly enough. I can no longer tell which sentence was meant for the town, and which one was only meant for the man in the mirror.',
  },
  butcher: {
    voiceId: 'dialogue-butcher',
    zh: '这些家伙认座位，比人认门牌还认真。坐错一把椅子，它们宁可饿着，也不肯把晚餐吃完。',
    en: 'They remember their seats better than people remember addresses. Put one of them in the wrong chair and it would rather go hungry than finish supper.',
  },
  elaine: {
    voiceId: 'dialogue-elaine',
    zh: '镜子碎了以后，每一块都还认得我一点。麻烦的是，它们彼此不肯承认看见的是同一个人。',
    en: 'After the mirror broke, every piece still recognised a little of me. The trouble is that none of them agrees they are looking at the same woman.',
  },
  milo: {
    voiceId: 'dialogue-milo',
    zh: '白天我知道衣柜只是衣柜。天一黑，它就先一步知道我在怕什么。你说，到底是哪一个房间在说谎？',
    en: 'By daylight I know the wardrobe is only a wardrobe. After dark it seems to know what I fear before I do. Tell me, which room is lying?',
  },
  postman: {
    voiceId: 'dialogue-postman',
    zh: '我每天都走到第七只邮箱。然后鞋底会重新踩回第一块石头。奇怪的是，海风从来不肯跟我一起回头。',
    en: 'Every day I reach the seventh postbox, and then my shoes are back on the first stone. The strange thing is, the sea wind never turns back with me.',
  },
  soren: {
    voiceId: 'dialogue-soren',
    zh: '脸会从我这里消失。脚步、呼吸，还有墙里第二次回来的声音，却从来没有忘记过。',
    en: 'Faces disappear from me. Footsteps, breathing, and the second sound that returns from inside a wall have never forgotten.',
  },
  waterWoman: {
    voiceId: 'dialogue-water-woman',
    zh: '这屋里的东西都学会了往回走。只有那只钟，像个不肯承认自己来迟的人。',
    en: 'Everything in this room has learned to move backward. Only the clock carries on like someone who refuses to admit they arrived too late.',
  },
} as const satisfies Record<string, WorldDialogue>;
