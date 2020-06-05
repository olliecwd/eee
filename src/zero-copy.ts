type SupportedJSPrimitive = number | undefined;

interface Struct {
  [key: string]: SupportedJSPrimitive | Struct;
}

type ByteOffsetMap = {
  [key: string]: number | ByteOffsetMap;
};

function isSupportedJSType<T>(v: T): boolean {
  switch (typeof v) {
    case 'number':
    case 'undefined': {
      return true;
    }
    default:
      return false;
  }
}

function convertSupportedJSPrimitiveToByteArray(
  v: SupportedJSPrimitive
): Int8Array {
  switch (typeof v) {
    case 'number': {
      const arr = new Float32Array(1);
      arr[0] = v;
      console.log(v, arr);
      return new Int8Array(arr.buffer);
    }
    default: {
      return new Int8Array(0);
    }
  }
}

function recStructBuilder<T extends object>(
  fields: T,
  runningOffsetInBytesParam: number
): [ByteOffsetMap, Int8Array[], number] {
  const keyMap = {} as ByteOffsetMap;
  const runningBuffers = [] as Int8Array[];
  let runningOffsetInBytes = runningOffsetInBytesParam;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.entries(fields).forEach(([k, v]: [string, any]): void => {
    if (isSupportedJSType(v)) {
      const arr = convertSupportedJSPrimitiveToByteArray(
        v as SupportedJSPrimitive
      );
      keyMap[k] = runningOffsetInBytes;
      runningOffsetInBytes += arr.byteLength;
      runningBuffers.push(arr);
    } else {
      const [childKeyMap, childBuffers, updatedOffset] = recStructBuilder(
        v,
        runningOffsetInBytes
      );
      keyMap[k] = childKeyMap;
      runningOffsetInBytes = updatedOffset;
      for (let i = 0; i < childBuffers.length; i += 1) {
        runningBuffers.push(childBuffers[i]);
      }
    }
  });
  return [keyMap, runningBuffers, runningOffsetInBytes];
}

function struct<T extends object>(fields: T): [ByteOffsetMap, Int8Array] {
  const [keyMap, bytesLists, sizeInBytes] = recStructBuilder(fields, 0);
  const flattenedBytes = new Int8Array(sizeInBytes);
  let runningIndex = 0;
  for (let i = 0; i < bytesLists.length; i += 1) {
    for (let j = 0; j < bytesLists[i].length; j += 1) {
      flattenedBytes[runningIndex] = bytesLists[i][j];
      runningIndex += 1;
    }
  }
  return [keyMap, flattenedBytes];
}

function createProxyFromOffsetMapAndBytes<T extends object>(
  x: T,
  keyMap: ByteOffsetMap,
  buf: Int8Array
): T {
  const handler = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(target: T, key: string): any {
      console.log('G: ', target, key);
      if (!(key in target) || !(key in x)) {
        console.log('hi', key, target);
        return undefined;
      }

      const offsetExtract = keyMap[key];

      if (isSupportedJSType(offsetExtract)) {
        const offset = offsetExtract as number;

        const byteView = new Int8Array([
          buf[offset],
          buf[offset + 1],
          buf[offset + 2],
          buf[offset + 3],
        ]);
        const f = new Float32Array(byteView.buffer);
        return f[0];
      }

      const tk = key as keyof T;
      const yddd = x[tk] as T[keyof T] & object;

      return createProxyFromOffsetMapAndBytes(
        yddd,
        offsetExtract as ByteOffsetMap,
        buf
      );
    },
  };

  return new Proxy(x, handler);
}

interface A {
  d: {
    dd: number;
    jdjd: number;
    ieie: { euueue: { eu3ueue: { e: number }; e: number } };
    d2: number;
  };
  dwadw: { oo: number };
  key: number;
}

type FiberLifted<T> = T & { _fiberBytes: Int8Array };

function lift<T extends object>(x: T): FiberLifted<T> {
  const [km, buf] = struct(x);
  const p = createProxyFromOffsetMapAndBytes(x, km, buf);
  return { ...p, _fiberBytes: buf };
}

function shift(x: any, y: any) {
  console.log('s');
}

export async function run(): Promise<void> {
  const x = {
    key: 1,
    d: {
      dd: 2,
      d2: 34,
      jdjd: 3232131,
      ieie: {
        euueue: {
          eu3ueue: {
            e: 4,
          },
          e: 4,
        },
      },
    },
    dwadw: {
      oo: 321323,
    },
  } as A;

  const ball = {
    id: 3,
    pos: {
      x: 44,
      y: 32,
    },
    vel: {
      dx: 3,
      dy: 2,
    },
  };

  const liftedBalls = zerocopy.encode(ball);
  const px1 = bits.pos.x;
  const px2 = ball.pos.x;
  const x = worker.signla(liftedBalls);

  console.log(px1); // output: 44
  console.log(px2); // output: 44
}
