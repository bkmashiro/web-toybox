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
    href: './toys/kendama/', packageName: '@web-toybox/kendama · preview', status: '可玩',
  },
  {
    name: '悠悠球', kana: 'YO-YO', verb: '放',
    description: '放线、睡眠、回收，让转速沿着一根线慢慢唱出来。',
    image: new URL('./cards/yoyo.svg', import.meta.url).href,
    href: './toys/yoyo/', packageName: '@web-toybox/yoyo · preview', status: '可玩',
  },
  {
    name: '翻板', kana: "JACOB'S LADDER", verb: '翻',
    description: '一串木片接力落下，像一小段不会结束的瀑布。',
    image: new URL('./cards/ladder.svg', import.meta.url).href,
    href: './toys/jacobs-ladder/', packageName: '@web-toybox/jacobs-ladder · preview', status: '可玩',
  },
  {
    name: '铁皮青蛙', kana: 'TIN FROG', verb: '拧',
    description: '上紧发条，看薄铁皮和小齿轮把青蛙一步步送出去。',
    image: new URL('./cards/frog.svg', import.meta.url).href,
    href: './toys/tin-frog/', packageName: '@web-toybox/tin-frog · preview', status: '可玩',
  },
];
