/**
 * English narration registry. Every entry is shipped as a real OGG asset under
 * public/assets/audio/voice/ so playback is deterministic and does not depend on
 * SpeechSynthesis or the player's installed voices. Chinese subtitles remain canonical.
 */
export const VOICEOVER_EN: Readonly<Record<string, readonly string[]>> = {
  'opening-v46': [
    'Rain never falls straight on Pier Seven. It comes sideways from the sea and turns the old street into a page that has not yet dried.',
    'That night, only the mask shop kept its light. The master was gone, his coat still by the door, the tea still warm, and the knives already cold.',
    'A-Qi had grown up measuring wood, listening to blades, and learning the width of a face. The master called a face the easiest address in the world.',
    'When A-Qi pushed the door open, the room offered no answer. Only a lamp left burning, a locked wooden case, and familiar things that no longer felt entirely familiar.',
  ],
  'cine-prologue': [
    'Rain came sideways across Pier Seven, leaving the old street dark except for one window.',
    'The master was gone. Tea was still warm, his coat still hung by the door, and a faceless wooden case waited on the bench.',
    'A-Qi had learned every measure of a face in this room, and began to wonder whether an address repeated for too long could become a prison.',
  ],
  'cine-secret': [
    'Behind the shop, dust has been waiting longer than any customer.',
    'The jars hold fragments of lives: what was seen, what was repeated, what another person remembers.',
    'A craft can preserve a face for years, and still forget to ask who had the right to define it.',
  ],
  'cine-water': [
    'Cold water closes over the room without touching the lungs.',
    'A woman stands somewhere beyond the rippling glass, never turning far enough to become a portrait.',
    'Memory does not return in order. It arrives as pressure, as sound, as a room remembering where it used to be.',
  ],
  'cine-mayor': [
    'Oswin kept his public words polished until they reflected everyone except himself.',
    'At home, paper kept a quieter record: creases, erased figures, names pressed too hard into the page.',
    'A person is not the sentence spoken beneath a lamp. Nor are they the secret kept after the room goes dark.',
  ],
  'cine-butcher': [
    'Glen named every animal that entered his yard.',
    'People laughed at the tenderness of a man who still had a knife to lift the next morning.',
    'Yet habit has its own mercy. Chairs remember weight. Bowls remember who refused to eat alone.',
  ],
  'cine-elaine': [
    'Elaine wore more faces than most people see in a lifetime.',
    'Powder changed, photographs faded, audiences forgot. The body kept its smaller loyalties.',
    'Before the curtain rose, one shoulder always moved first. Before the high note, the same two breaths returned.',
  ],
  'cine-milo': [
    'Milo slept in a room where every object kept its ordinary name.',
    'Fear did not move the wardrobe or the bed. It only changed the story told about whoever stood beside them.',
    'Sometimes the most dangerous mask is not worn on a face. It is the explanation we refuse to question.',
  ],
  'cine-postman': [
    'Elias walked the coast until the path knew the shape of his shoes.',
    'He remembered the morning his wife left with terrible accuracy.',
    'There are memories that keep us company, and memories that quietly ask the body to repeat yesterday forever.',
  ],
  'cine-soren': [
    'Soren could no longer summon a face from memory.',
    'He remembered the drag of a step, the breath before a name, the second answer hidden inside a wall.',
    'Darkness had not emptied his world. It had only removed one language from it.',
  ],
  'cine-blank': [
    'There was no order number on the white mask.',
    'Three old belongings waited in the room, each true, none complete.',
    'For once, silence did not feel like absence. It felt like no one else had spoken first.',
  ],
  'cine-finale': [
    'When the back wall opened, three machines woke as if they had been holding their breath for years.',
    'The craft had built a grammar for recognition: seeing, hearing, speaking, acting, warmth, discernment.',
    'And beside that grammar, an empty place remained. Not unfinished. Simply unnamed.',
  ],
  'cine-ending': [
    'The machines had worked. That was what made the mistake difficult to see.',
    'To keep someone stable is not the same as making them complete.',
    'At the mirror, the last decision belonged to the only hand that had never been asked.',
  ],
  'cine-chapter-two': [
    'After the water receded, five old masks seemed to have turned toward the door.',
    'The people on their order slips were still alive somewhere in town, still making small mistakes, still keeping small habits.',
    'A vanished master had left no map. Only five unfinished conversations hanging on a wall.',
  ],
  'cine-water-outro': [
    'The room loosened its grip. Glass, paper, and breath returned to stillness.',
    'In the memory, the master paused before finishing a face, as though his hand had once understood restraint.',
    'Then the water closed over the moment, leaving only the ache of something deliberately left undone.',
  ],
  'cine-outro-mayor': [
    'Nothing on the desk became pure. The contradictions simply stopped hiding one another.',
    'A faint ridge rose from the grain of the wood, shaped by the difficult habit of looking twice.',
  ],
  'cine-outro-butcher': [
    'The table settled. One empty place no longer looked like an omission.',
    'Something remained in the quiet after the plates stopped moving: not a farewell, but proof that care had been practised here.',
  ],
  'cine-outro-elaine': [
    'The mirror closed around twelve different years.',
    'What endured was not a face. It was the small choreography the body had kept when no one was watching.',
  ],
  'cine-outro-milo': [
    'The monsters did not die. They simply lost the right to be the only explanation.',
    'In the room that followed, familiar objects became ordinary again one at a time.',
  ],
  'cine-outro-postman': [
    'The old morning remained exactly where memory had left it.',
    'Only the next step changed, and sometimes that is enough to open a road.',
  ],
  'cine-box-opened': [
    'The lid opened on two ordinary things: a thin rubbing and a small coil of thread polished by years of handling.',
    'Neither looked like a secret. The master kept such things because they preserved a piece of a life without pretending to explain the whole person.',
    'The back-room door stood slightly open. The dust in its hinge had not been touched by the rain.',
  ],
  'cine-craft-finished': [
    'The rubbing gave the wood only an outline. The worn thread added the small movement that years had repeated into habit.',
    'The ticket proved nothing by itself. It only meant that someone else had once been there, and had remembered the same piece of time.',
    'When all three traces settled, a muffled clock sounded behind the wall. A drop of water rose from the floor toward the ceiling.',
  ],
  'cine-soren-unlock': [
    'After the third mask returned, the wall answered a sound with another sound half a breath later.',
    'A worn name card slid from the dust: Soren.',
    'The master had written only one line beneath it: He forgets faces, but never the person arriving.',
  ],
  'cine-blank-unlock': [
    'When the last old order returned to the wall, a white mask appeared on the bench.',
    'No date. No customer. No instruction about which way it should face.',
    'For once, the wood seemed in no hurry to become anyone.',
  ],
  'cine-finale-unlock': [
    'Seven residues returned to the shop, and something behind the wall finally began to move.',
    'Dust fell from the mortar like dry snow.',
    'No final letter waited inside. Only machinery, and an empty place where a conclusion should have been.',
  ],
  'cine-finale-reveal': [
    'Every measured function held steady. The craft had not failed in the way a broken machine fails.',
    'Its error came later, when stability was mistaken for completeness, and care for permission.',
    'At the old mirror, an unfinished mark no longer looked like damage. It looked like room left for a life to continue.',
  ],
  'cine-ending-accept': [
    'The half face met the mirror, but the wood did not spread to cover what was already there.',
    'By morning, the shop still opened. New orders carried one added line: not every blank is asking to be filled.',
  ],
  'cine-ending-unfixed': [
    'The last thread came free, and no hidden true face appeared underneath.',
    'Outside, the town looked unchanged. Only the need to prove which face was most original had gone quiet.',
  ],
  'cine-ending-close': [
    'When the work lamp went dark, the masks became wood again.',
    'The door closed on a craft that had finally learned one final possibility: an ending does not require an heir.',
  ],
};
