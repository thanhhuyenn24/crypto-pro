// --- MANUAL DES CORE ---
const DES = (() => {
    const PC1=[57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4];
    const PC2=[14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,41,52,31,37,47,55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32];
    const IP=[58,50,42,34,26,18,10,2,60,52,44,36,28,20,12,4,62,54,46,38,30,22,14,6,64,56,48,40,32,24,16,8,57,49,41,33,25,17,9,1,59,51,43,35,27,19,11,3,61,53,45,37,29,21,13,5,63,55,47,39,31,23,15,7];
    const IP_INV=[40,8,48,16,56,24,64,32,39,7,47,15,55,23,63,31,38,6,46,14,54,22,62,30,37,5,45,13,53,21,61,29,36,4,44,12,52,20,60,28,35,3,43,11,51,19,59,27,34,2,42,10,50,18,58,26,33,1,41,9,49,17,57,25];
    const E=[32,1,2,3,4,5,4,5,6,7,8,9,8,9,10,11,12,13,12,13,14,15,16,17,16,17,18,19,20,21,20,21,22,23,24,25,24,25,26,27,28,29,28,29,30,31,32,1];
    const P=[16,7,20,21,29,12,28,17,1,15,23,26,5,18,31,10,2,8,24,14,32,27,3,9,19,13,30,6,22,11,4,25];
    const SBOX=[[[14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7],[0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8],[4,1,14,8,13,6,2,11,15,12,9,7,3,10,5,0],[15,12,8,2,4,9,1,7,5,11,3,14,10,0,6,13]],[[15,1,8,14,6,11,3,4,9,7,2,13,12,0,5,10],[3,13,4,7,15,2,8,14,12,0,1,10,6,9,11,5],[0,14,7,11,10,4,13,1,5,8,12,6,9,3,2,15],[13,8,10,1,3,15,4,2,11,6,7,12,0,5,14,9]],[[10,0,9,14,6,3,15,5,1,13,12,7,11,4,2,8],[13,7,0,9,3,4,6,10,2,8,5,14,12,11,15,1],[13,6,4,9,8,15,3,0,11,1,2,12,5,10,14,7],[1,10,13,0,6,9,8,7,4,15,14,3,11,5,2,12]],[[7,13,14,3,0,6,9,10,1,2,8,5,11,12,4,15],[13,8,11,5,6,15,0,3,4,7,2,12,1,10,14,9],[10,6,9,0,12,11,7,13,15,1,3,14,5,2,8,4],[3,15,0,6,10,1,13,8,9,4,5,11,12,7,2,14]],[[2,12,4,1,7,10,11,6,8,5,3,15,13,0,14,9],[14,11,2,12,4,7,13,1,5,0,15,10,3,9,8,6],[4,2,1,11,10,13,7,8,15,9,12,5,6,3,0,14],[11,8,12,7,1,14,2,13,6,15,0,9,10,4,5,3]],[[12,1,10,15,9,2,6,8,0,13,3,4,14,7,5,11],[10,15,4,2,7,12,9,5,6,1,13,14,0,11,3,8],[9,14,15,5,2,8,12,3,7,0,4,10,1,13,11,6],[4,3,2,12,9,5,15,10,11,14,1,7,6,0,8,13]],[[4,11,2,14,15,0,8,13,3,12,9,7,5,10,6,1],[13,0,11,7,4,9,1,10,14,3,5,12,2,15,8,6],[1,4,11,13,12,3,7,14,10,15,6,8,0,5,9,2],[6,11,13,8,1,4,10,7,9,5,0,15,14,2,3,12]],[[13,2,8,4,6,15,11,1,10,9,3,14,5,0,12,7],[1,15,13,8,10,3,7,4,12,5,6,11,0,14,9,2],[7,11,4,1,9,12,14,2,0,6,10,13,15,3,5,8],[2,1,14,7,4,10,8,13,15,12,9,0,3,5,6,11]]];
    const SHIFTS=[1,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1];
    const permute=(inp,tbl)=>{let out=[];for(let i=0;i<tbl.length;i++)out.push(inp[tbl[i]-1]);return out;};
    const b2bits=bytes=>{let bits=[];for(let b of bytes)for(let i=7;i>=0;i--)bits.push((b>>i)&1);return bits;};
    const bits2b=bits=>{let bytes=[];for(let i=0;i<bits.length;i+=8){let b=0;for(let j=0;j<8;j++)if(bits[i+j])b|=(1<<(7-j));bytes.push(b);}return new Uint8Array(bytes);};
    const genKeys=kBytes=>{let kBits=b2bits(kBytes),kP=permute(kBits,PC1),C=kP.slice(0,28),D=kP.slice(28,56),keys=[];for(let i=0;i<16;i++){let s=SHIFTS[i];C=C.slice(s).concat(C.slice(0,s));D=D.slice(s).concat(D.slice(0,s));keys.push(permute(C.concat(D),PC2));}return keys;};
    const proc=(blk,keys)=>{let bits=b2bits(blk),ip=permute(bits,IP),L=ip.slice(0,32),R=ip.slice(32,64);for(let i=0;i<16;i++){let prevL=L,expR=permute(R,E),x=expR.map((v,j)=>v^keys[i][j]),sOut=[];for(let j=0;j<8;j++){let r=(x[j*6]<<1)|x[j*6+5],c=(x[j*6+1]<<3)|(x[j*6+2]<<2)|(x[j*6+3]<<1)|x[j*6+4],val=SBOX[j][r][c];for(let k=3;k>=0;k--)sOut.push((val>>k)&1);}let p=permute(sOut,P);L=R;R=prevL.map((v,j)=>v^p[j]);}return bits2b(permute(R.concat(L),IP_INV));};
    return {
        blockSize:8, keySize:8,
        encryptBlock:(b,k)=>proc(b,genKeys(k)),
        decryptBlock:(b,k)=>proc(b,genKeys(k).reverse())
    };
})();

// --- MANUAL AES CORE ---
const AES = (() => {
    const SBOX=[0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16];
    const ISBOX=new Array(256).fill(0).map((_,i)=>SBOX.indexOf(i));
    const RCON=[0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36];
    const gmul=(a,b)=>{let p=0;for(let i=0;i<8;i++){if(b&1)p^=a;let h=a&0x80;a=(a<<1)&0xff;if(h)a^=0x1b;b>>=1;}return p;};
    const keyExp=key=>{const nb=4,nk=key.length/4,nr=nk+6;let w=new Uint32Array(nb*(nr+1));for(let i=0;i<nk;i++)w[i]=(key[4*i]<<24)|(key[4*i+1]<<16)|(key[4*i+2]<<8)|key[4*i+3];for(let i=nk;i<nb*(nr+1);i++){let t=w[i-1];if(i%nk===0){t=((t<<8)|(t>>>24));let s=((SBOX[(t>>>24)&0xff]<<24)|(SBOX[(t>>>16)&0xff]<<16)|(SBOX[(t>>>8)&0xff]<<8)|SBOX[t&0xff]);t=s^(RCON[i/nk-1]<<24);}else if(nk>6&&i%nk===4){let s=((SBOX[(t>>>24)&0xff]<<24)|(SBOX[(t>>>16)&0xff]<<16)|(SBOX[(t>>>8)&0xff]<<8)|SBOX[t&0xff]);t=s;}w[i]=w[i-nk]^t;}return w;};
    const addK=(s,w,r)=>{for(let c=0;c<4;c++){let k=w[r*4+c];s[0][c]^=(k>>>24)&0xff;s[1][c]^=(k>>>16)&0xff;s[2][c]^=(k>>>8)&0xff;s[3][c]^=k&0xff;}};
    const sub=(s,box)=>{for(let r=0;r<4;r++)for(let c=0;c<4;c++)s[r][c]=box[s[r][c]];};
    const shift=(s,inv)=>{if(!inv){let t=s[1][0];s[1][0]=s[1][1];s[1][1]=s[1][2];s[1][2]=s[1][3];s[1][3]=t;t=s[2][0];s[2][0]=s[2][2];s[2][2]=t;t=s[2][1];s[2][1]=s[2][3];s[2][3]=t;t=s[3][3];s[3][3]=s[3][2];s[3][2]=s[3][1];s[3][1]=s[3][0];s[3][0]=t;}else{let t=s[1][3];s[1][3]=s[1][2];s[1][2]=s[1][1];s[1][1]=s[1][0];s[1][0]=t;t=s[2][0];s[2][0]=s[2][2];s[2][2]=t;t=s[2][1];s[2][1]=s[2][3];s[2][3]=t;t=s[3][0];s[3][0]=s[3][1];s[3][1]=s[3][2];s[3][2]=s[3][3];s[3][3]=t;}};
    const mix=(s,inv)=>{for(let c=0;c<4;c++){let a=s[0][c],b=s[1][c],d=s[2][c],e=s[3][c];if(!inv){s[0][c]=gmul(2,a)^gmul(3,b)^d^e;s[1][c]=a^gmul(2,b)^gmul(3,d)^e;s[2][c]=a^b^gmul(2,d)^gmul(3,e);s[3][c]=gmul(3,a)^b^d^gmul(2,e);}else{s[0][c]=gmul(14,a)^gmul(11,b)^gmul(13,d)^gmul(9,e);s[1][c]=gmul(9,a)^gmul(14,b)^gmul(11,d)^gmul(13,e);s[2][c]=gmul(13,a)^gmul(9,b)^gmul(14,d)^gmul(11,e);s[3][c]=gmul(11,a)^gmul(13,b)^gmul(9,d)^gmul(14,e);}}};
    const proc=(inp,w,enc,nk)=>{let s=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];for(let i=0;i<16;i++)s[i%4][Math.floor(i/4)]=inp[i];let nr=nk+6;addK(s,w,enc?0:nr);for(let r=1;r<nr;r++){if(enc){sub(s,SBOX);shift(s,false);mix(s,false);addK(s,w,r);}else{shift(s,true);sub(s,ISBOX);addK(s,w,nr-r);mix(s,true);}}if(enc){sub(s,SBOX);shift(s,false);addK(s,w,nr);}else{shift(s,true);sub(s,ISBOX);addK(s,w,0);}let out=new Uint8Array(16);for(let i=0;i<16;i++)out[i]=s[i%4][Math.floor(i/4)];return out;};
    return { blockSize:16, encryptBlock:(b,k)=>proc(b,keyExp(k),true,k.length/4), decryptBlock:(b,k)=>proc(b,keyExp(k),false,k.length/4) };
})();

// --- BLOCK CIPHER WRAPPER ---
const BlockCipher = {
    run: (algoName, mode, data, key, iv, isEnc) => {
        const Algo = algoName==='DES'?DES:AES;
        const bs = Algo.blockSize;
        
        let procData = data;
        if(isEnc) {
            let pLen = bs-(data.length%bs), pArr=new Uint8Array(pLen).fill(pLen);
            let tmp=new Uint8Array(data.length+pLen); tmp.set(data); tmp.set(pArr,data.length);
            procData=tmp;
        }

        let res = new Uint8Array(procData.length);
        let prev = iv ? iv.slice() : new Uint8Array(bs);
        
        for(let i=0; i<procData.length; i+=bs) {
            let blk = procData.slice(i, i+bs);
            let out;
            if(isEnc) {
                if(mode==='CBC') blk = Utils.xor(blk, prev);
                out = Algo.encryptBlock(blk, key);
                if(mode==='CBC') prev = out;
            } else {
                let nextPrev = blk;
                out = Algo.decryptBlock(blk, key);
                if(mode==='CBC') { out = Utils.xor(out, prev); prev = nextPrev; }
            }
            res.set(out, i);
        }

        if(!isEnc) {
            let pLen = res[res.length-1];
            if(pLen>0 && pLen<=bs) res = res.slice(0, res.length-pLen);
        }
        return res;
    }
};