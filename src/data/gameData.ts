export const MAIN_MASKS=['mayor','butcher','elaine','milo','postman'] as const;
export const MASKS:any={
 mayor:{name:'镇长 · 奥斯文',residue:'res_bian',label:'辨 · 鼻子',image:'mayor.webp',verb:'翻 / 放 / 对照'},
 butcher:{name:'屠夫 · 格伦',residue:'res_yan',label:'言 · 嘴唇',image:'butcher.webp',verb:'摆放 / 拉椅'},
 elaine:{name:'舞台女郎 · 伊莲',residue:'res_ting',label:'听 · 耳朵',image:'elaine.webp',verb:'拖 / 转 / 拼'},
 milo:{name:'鞋匠之子 · 米罗',residue:'res_jian',label:'见 · 眼睛',image:'milo.webp',verb:'切换 / 搬动'},
 postman:{name:'邮差 · 埃利亚斯',residue:'res_xing',label:'行 · 眉毛',image:'postman.webp',verb:'走 / 转身'},
 soren:{name:'盲眼老人 · 索伦',residue:'res_wen',label:'温 · 脸颊',image:'soren.webp',verb:'敲 / 扫描'},
 blank:{name:'给自己的空白',residue:'res_blank',label:'未定形 · 透明残响',image:'blank.webp',verb:'靠近 / 拿起'}
};
export const OBS:any={
 box_eye:{title:'镜中木盒先长出眼睛',text:'现实木盒仍然空白。五官来自关系，不来自盒面本身。',group:'物理'},
 box_missing:{title:'五官不是五枚开关',text:'灯、镜子、娃娃、反光和坐姿改变的是关系。',group:'工艺'},
 jars:{title:'七只玻璃罐只保存功能',text:'见、辨、听、行、言、温与未定形并不是七个人格。',group:'工艺'},
 master_rule:{title:'师父不打死结',text:'习惯比相貌稳定，却仍不能单独定义一个人。',group:'行为'},
 water_reverse:{title:'只有墙钟没有服从倒流',text:'时间异常可被手动操纵；第三声之后镜面起雾。',group:'时间'},
 mother_note:{title:'“不要替他——”',text:'句子在镜雾中没有写完。缺失本身可能是信息。',group:'身份'},
 mayor_public:{title:'公开说法会改变场景',text:'同一句话在讲台与私人办公室留下不同后果。',group:'行为'},
 mayor_father:{title:'真实想法不等于真实行为',text:'要用物证同时校验公开与私人叙事。',group:'行为'},
 butcher_six:{title:'六份档案对应六种稳定习惯',text:'座位错误时，动物会用行为拒绝。',group:'空间'},
 butcher_sender:{title:'第七把椅子属于送行者',text:'格伦总在安排告别，却从不让自己坐下。',group:'身份'},
 elaine_habit:{title:'不同年龄共享同一动作习惯',text:'旧耳洞、烧伤与高音前两次吸气跨越妆容与年龄。',group:'身份'},
 elaine_face:{title:'拼成的不是一张“原始脸”',text:'同步动作比任何单张脸更稳定。',group:'身份'},
 milo_monster:{title:'怪物与现实物件占据同一位置',text:'面具改变观察规则，而不是生成另一间房。',group:'物理'},
 milo_fear:{title:'看懂并不会让害怕消失',text:'兽形解释来自儿童认知，却仍对应现实关系。',group:'行为'},
 postman_loop:{title:'每第七步道路重置',text:'循环不是字幕，而是脚下发生的空间规则。',group:'时间'},
 postman_reverse:{title:'第6步后逆行不会重置',text:'主动后退一次会打断重复。',group:'时间'},
 soren_echo:{title:'夹层墙产生双重回声',text:'异常区域不是热点，而是声音性质改变。',group:'空间'},
 soren_voice:{title:'声纹可以画出房间',text:'视觉声纹与左右声道共同呈现距离和材质。',group:'空间'},
 blank_choice:{title:'空白残响记录主动选择',text:'它不提供正确答案，只记录阿七第一次明确想要什么。',group:'身份'},
 six_functions:{title:'六种残响让脸稳定',text:'稳定功能不等于“应该成为谁”。',group:'工艺'}
};
export const VALID_RELATIONS=[['box_eye','box_missing'],['jars','master_rule'],['water_reverse','mother_note'],['mayor_public','mayor_father'],['butcher_six','butcher_sender'],['elaine_habit','elaine_face'],['milo_monster','milo_fear'],['postman_loop','postman_reverse'],['soren_echo','soren_voice'],['blank_choice','six_functions']];
export const MASK_EPILOGUES:any={
 mayor:['奥斯文摘下面具时，讲台后那面墙仍旧平整。','只有抽屉里的一封辞职信，比所有奖状更像他的脸。','阿七把鼻梁残响收进布袋，没有替他说完那句话。'],
 butcher:['第六只盘子被收走以后，第七把椅子还留在原地。','格伦把围裙叠得像一封正式公文，坐下时没有人鼓掌。','屋里第一次没有谁负责送别。'],
 elaine:['镜灯一盏一盏熄灭，十二张脸也跟着退进黑里。','最后留下的不是某一张面孔，而是高音之前那两次短促吸气。','习惯比妆更慢，也比名字活得久。'],
 milo:['怪物重新变成人时，房间没有因此变安全。','父亲依旧病弱，母亲依旧紧张，镇长依旧在门口换领带。','孩子只是第一次知道：害怕并不会因为看懂而消失。'],
 postman:['第七封信终于离开手心以后，海边没有发生奇迹。','风仍旧从同一个方向来，邮箱仍旧生锈。','只是那条路第一次允许一个人走到昨天以外。'],
 soren:['黑暗里最后一圈声纹慢慢散开。','索伦没有说起那张已经记不住的脸，只用指尖碰了碰表盖。','有些人离开以后，房间仍知道他们曾经站在哪里。'],
 blank:['空白面具没有学会一种新的表情。','它只是把阿七真正选过的一件东西、一条方向，安静地留了下来。','第一次，没有谁替这次选择命名。']
};
