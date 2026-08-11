export interface ToyCard {
  name: string;
  kana: string;
  verb: string;
  description: string;
  image: string;
  href?: string;
  packageName?: string;
  status: '可玩' | '制作中';
  external?: boolean;
}

export const toys: ToyCard[] = [
  {
    name: '竹知了', kana: 'BAMBOO CICADA', verb: '甩',
    description: '抓住竹棒画一圈，把纸膜、空竹筒和整个盛夏一起甩响。',
    image: new URL('./cards/zhuzhiliao.svg', import.meta.url).href,
    href: 'https://bkmashiro.github.io/bamboo-cicada/', packageName: 'zhuzhiliao', status: '可玩', external: true,
  },
  {
    name: '剑玉', kana: 'KENDAMA', verb: '接',
    description: '木球、棉线和三个皿。拖住剑身，把球送回杯口。',
    image: new URL('./cards/kendama.svg', import.meta.url).href,
    href: './toys/kendama/', packageName: '@web-toybox/kendama · npm', status: '可玩',
  },
  {
    name: '悠悠球', kana: 'YO-YO', verb: '放',
    description: '放线、睡眠、回收，让转速沿着一根线慢慢唱出来。',
    image: new URL('./cards/yoyo.svg', import.meta.url).href,
    href: './toys/yoyo/', packageName: '@web-toybox/yoyo · npm', status: '可玩',
  },
  {
    name: '翻板', kana: "JACOB'S LADDER", verb: '翻',
    description: '一串木片接力落下，像一小段不会结束的瀑布。',
    image: new URL('./cards/ladder.svg', import.meta.url).href,
    href: './toys/jacobs-ladder/', packageName: '@web-toybox/jacobs-ladder · npm', status: '可玩',
  },
  {
    name: '铁皮青蛙', kana: 'TIN FROG', verb: '拧',
    description: '上紧发条，看薄铁皮和小齿轮把青蛙一步步送出去。',
    image: new URL('./cards/frog.svg', import.meta.url).href,
    href: './toys/tin-frog/', packageName: '@web-toybox/tin-frog · npm', status: '可玩',
  },
  {
    name: '七巧板', kana: 'TANGRAM', verb: '拼',
    description: '七块多边形没有唯一答案，拖动、转向，慢慢拼出脑海里的轮廓。',
    image: new URL('./cards/tangram.svg', import.meta.url).href,
    href: './toys/tangram/', packageName: '@web-toybox/tangram · npm', status: '可玩',
  },
  {
    name: '十五滑块', kana: 'FIFTEEN PUZZLE', verb: '挪',
    description: '十五块木牌和一个空位；每次只挪一步，把乱序慢慢送回原位。',
    image: new URL('./cards/sliding-puzzle.svg', import.meta.url).href,
    href: './toys/sliding-puzzle/', packageName: '@web-toybox/sliding-puzzle · npm', status: '可玩',
  },
  {
    name: '孔明棋', kana: 'PEG SOLITAIRE', verb: '跳',
    description: '跨过一颗，拿走一颗。在木盘上把三十二颗棋子收束到最后一颗。',
    image: new URL('./cards/peg-solitaire.svg', import.meta.url).href,
    href: './toys/peg-solitaire/', packageName: '@web-toybox/peg-solitaire · npm', status: '可玩',
  },
  {
    name: '滚珠迷宫', kana: 'MARBLE MAZE', verb: '倾',
    description: '倾斜木盘，让钢珠绕过隔板和黑洞，慢慢滚进最后一只铜圈。',
    image: new URL('./cards/marble-maze.svg', import.meta.url).href,
    href: './toys/marble-maze/', packageName: '@web-toybox/marble-maze · preview', status: '可玩',
  },
  {
    name: '弹珠钉板', kana: 'PINBOARD', verb: '落',
    description: '挑一条落珠路线，听玻璃珠一路敲过铜钉，看看最后掉进哪格。',
    image: new URL('./cards/pinboard.svg', import.meta.url).href,
    href: './toys/pinboard/', packageName: '@web-toybox/pinboard · preview', status: '可玩',
  },
  {
    name: '桌上纸足球', kana: 'PAPER FOOTBALL', verb: '弹',
    description: '折一枚三角纸片，向后拉开，借着桌边反弹把它送进小球门。',
    image: new URL('./cards/paper-football.svg', import.meta.url).href,
    href: './toys/paper-football/', packageName: '@web-toybox/paper-football · preview', status: '可玩',
  },
];
