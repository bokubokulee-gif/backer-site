/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */var El=0,xs=1,Tl=2,ys=1,bl=2,Kt=3,or=0,xt=1,Jt=2,lr=0,Nr=1,wa=2,Ms=3,Ss=4,wl=5,yr=100,Al=101,Rl=102,Cl=103,Pl=104,Ul=200,Ll=201,Dl=202,Il=203,Aa=204,Ra=205,Nl=206,Ol=207,Fl=208,Bl=209,zl=210,Hl=211,Vl=212,Gl=213,kl=214,Ca=0,Pa=1,Ua=2,Or=3,La=4,Da=5,Ia=6,Na=7,Es=0,Wl=1,Xl=2,hr=0,jl=1,ql=2,Yl=3,Ts=4,Zl=5,Kl=6,Jl=7,bs=300,Fr=301,Br=302,Oa=303,Fa=304,Ni=306,Oi=1e3,Mr=1001,Ba=1002,Lt=1003,$l=1004,Fi=1005,Gt=1006,za=1007,Sr=1008,kt=1009,ws=1010,As=1011,di=1012,Ha=1013,Er=1014,$t=1015,pi=1016,Va=1017,Ga=1018,fi=1020,Rs=35902,Cs=1021,Ps=1022,Dt=1023,mi=1026,gi=1027,Us=1028,ka=1029,Ls=1030,Wa=1031,Xa=1033,Bi=33776,zi=33777,Hi=33778,Vi=33779,ja=35840,qa=35841,Ya=35842,Za=35843,Ka=36196,Ja=37492,$a=37496,Qa=37808,en=37809,tn=37810,rn=37811,an=37812,nn=37813,sn=37814,on=37815,ln=37816,hn=37817,cn=37818,un=37819,dn=37820,pn=37821,Gi=36492,fn=36494,mn=36495,Ds=36283,gn=36284,_n=36285,vn=36286,ki=2300,xn=2301,yn=2302,Is=2400,Ns=2401,Os=2402,Ql=3200,eh=3201,Fs=0,th=1,cr="",yt="srgb",zr="srgb-linear",Wi="linear",Ye="srgb",Hr=7680,Bs=519,rh=512,ih=513,ah=514,zs=515,nh=516,sh=517,oh=518,lh=519,Hs=35044,Vs="300 es",Wt=2e3,Xi=2001,Vr=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let r=this._listeners;r[e]===void 0&&(r[e]=[]),r[e].indexOf(t)===-1&&r[e].push(t)}hasEventListener(e,t){let r=this._listeners;return r===void 0?!1:r[e]!==void 0&&r[e].indexOf(t)!==-1}removeEventListener(e,t){let r=this._listeners;if(r===void 0)return;let i=r[e];if(i!==void 0){let a=i.indexOf(t);a!==-1&&i.splice(a,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let r=t[e.type];if(r!==void 0){e.target=this;let i=r.slice(0);for(let a=0,n=i.length;a<n;a++)i[a].call(this,e);e.target=null}}},mt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Gs=1234567,_i=Math.PI/180,vi=180/Math.PI;function Gr(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,r=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(mt[e&255]+mt[e>>8&255]+mt[e>>16&255]+mt[e>>24&255]+"-"+mt[t&255]+mt[t>>8&255]+"-"+mt[t>>16&15|64]+mt[t>>24&255]+"-"+mt[r&63|128]+mt[r>>8&255]+"-"+mt[r>>16&255]+mt[r>>24&255]+mt[i&255]+mt[i>>8&255]+mt[i>>16&255]+mt[i>>24&255]).toLowerCase()}function ze(e,t,r){return Math.max(t,Math.min(r,e))}function Mn(e,t){return(e%t+t)%t}function hh(e,t,r,i,a){return i+(e-t)*(a-i)/(r-t)}function ch(e,t,r){return e!==t?(r-e)/(t-e):0}function xi(e,t,r){return(1-r)*e+r*t}function uh(e,t,r,i){return xi(e,t,1-Math.exp(-r*i))}function dh(e,t=1){return t-Math.abs(Mn(e,t*2)-t)}function ph(e,t,r){return e<=t?0:e>=r?1:(e=(e-t)/(r-t),e*e*(3-2*e))}function fh(e,t,r){return e<=t?0:e>=r?1:(e=(e-t)/(r-t),e*e*e*(e*(e*6-15)+10))}function mh(e,t){return e+Math.floor(Math.random()*(t-e+1))}function gh(e,t){return e+Math.random()*(t-e)}function _h(e){return e*(.5-Math.random())}function vh(e){e!==void 0&&(Gs=e);let t=Gs+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function xh(e){return e*_i}function yh(e){return e*vi}function Mh(e){return(e&e-1)===0&&e!==0}function Sh(e){return Math.pow(2,Math.ceil(Math.log(e)/Math.LN2))}function Eh(e){return Math.pow(2,Math.floor(Math.log(e)/Math.LN2))}function Th(e,t,r,i,a){let n=Math.cos,s=Math.sin,o=n(r/2),l=s(r/2),h=n((t+i)/2),c=s((t+i)/2),u=n((t-i)/2),d=s((t-i)/2),f=n((i-t)/2),x=s((i-t)/2);switch(a){case"XYX":e.set(o*c,l*u,l*d,o*h);break;case"YZY":e.set(l*d,o*c,l*u,o*h);break;case"ZXZ":e.set(l*u,l*d,o*c,o*h);break;case"XZX":e.set(o*c,l*x,l*f,o*h);break;case"YXY":e.set(l*f,o*c,l*x,o*h);break;case"ZYZ":e.set(l*x,l*f,o*c,o*h);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+a)}}function kr(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw new Error("Invalid component type.")}}function _t(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw new Error("Invalid component type.")}}var Qt={DEG2RAD:_i,RAD2DEG:vi,generateUUID:Gr,clamp:ze,euclideanModulo:Mn,mapLinear:hh,inverseLerp:ch,lerp:xi,damp:uh,pingpong:dh,smoothstep:ph,smootherstep:fh,randInt:mh,randFloat:gh,randFloatSpread:_h,seededRandom:vh,degToRad:xh,radToDeg:yh,isPowerOfTwo:Mh,ceilPowerOfTwo:Sh,floorPowerOfTwo:Eh,setQuaternionFromProperEuler:Th,normalize:_t,denormalize:kr},we=class il{constructor(t=0,r=0){il.prototype.isVector2=!0,this.x=t,this.y=r}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,r){return this.x=t,this.y=r,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,r){switch(t){case 0:this.x=r;break;case 1:this.y=r;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,r){return this.x=t.x+r.x,this.y=t.y+r.y,this}addScaledVector(t,r){return this.x+=t.x*r,this.y+=t.y*r,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,r){return this.x=t.x-r.x,this.y=t.y-r.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let r=this.x,i=this.y,a=t.elements;return this.x=a[0]*r+a[3]*i+a[6],this.y=a[1]*r+a[4]*i+a[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,r){return this.x=ze(this.x,t.x,r.x),this.y=ze(this.y,t.y,r.y),this}clampScalar(t,r){return this.x=ze(this.x,t,r),this.y=ze(this.y,t,r),this}clampLength(t,r){let i=this.length();return this.divideScalar(i||1).multiplyScalar(ze(i,t,r))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let r=Math.sqrt(this.lengthSq()*t.lengthSq());if(r===0)return Math.PI/2;let i=this.dot(t)/r;return Math.acos(ze(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let r=this.x-t.x,i=this.y-t.y;return r*r+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,r){return this.x+=(t.x-this.x)*r,this.y+=(t.y-this.y)*r,this}lerpVectors(t,r,i){return this.x=t.x+(r.x-t.x)*i,this.y=t.y+(r.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,r=0){return this.x=t[r],this.y=t[r+1],this}toArray(t=[],r=0){return t[r]=this.x,t[r+1]=this.y,t}fromBufferAttribute(t,r){return this.x=t.getX(r),this.y=t.getY(r),this}rotateAround(t,r){let i=Math.cos(r),a=Math.sin(r),n=this.x-t.x,s=this.y-t.y;return this.x=n*i-s*a+t.x,this.y=n*a+s*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Wr=class{constructor(e=0,t=0,r=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=r,this._w=i}static slerpFlat(e,t,r,i,a,n,s){let o=r[i+0],l=r[i+1],h=r[i+2],c=r[i+3],u=a[n+0],d=a[n+1],f=a[n+2],x=a[n+3];if(s===0){e[t+0]=o,e[t+1]=l,e[t+2]=h,e[t+3]=c;return}if(s===1){e[t+0]=u,e[t+1]=d,e[t+2]=f,e[t+3]=x;return}if(c!==x||o!==u||l!==d||h!==f){let _=1-s,m=o*u+l*d+h*f+c*x,p=m>=0?1:-1,b=1-m*m;if(b>Number.EPSILON){let T=Math.sqrt(b),D=Math.atan2(T,m*p);_=Math.sin(_*D)/T,s=Math.sin(s*D)/T}let M=s*p;if(o=o*_+u*M,l=l*_+d*M,h=h*_+f*M,c=c*_+x*M,_===1-s){let T=1/Math.sqrt(o*o+l*l+h*h+c*c);o*=T,l*=T,h*=T,c*=T}}e[t]=o,e[t+1]=l,e[t+2]=h,e[t+3]=c}static multiplyQuaternionsFlat(e,t,r,i,a,n){let s=r[i],o=r[i+1],l=r[i+2],h=r[i+3],c=a[n],u=a[n+1],d=a[n+2],f=a[n+3];return e[t]=s*f+h*c+o*d-l*u,e[t+1]=o*f+h*u+l*c-s*d,e[t+2]=l*f+h*d+s*u-o*c,e[t+3]=h*f-s*c-o*u-l*d,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,r,i){return this._x=e,this._y=t,this._z=r,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let r=e._x,i=e._y,a=e._z,n=e._order,s=Math.cos,o=Math.sin,l=s(r/2),h=s(i/2),c=s(a/2),u=o(r/2),d=o(i/2),f=o(a/2);switch(n){case"XYZ":this._x=u*h*c+l*d*f,this._y=l*d*c-u*h*f,this._z=l*h*f+u*d*c,this._w=l*h*c-u*d*f;break;case"YXZ":this._x=u*h*c+l*d*f,this._y=l*d*c-u*h*f,this._z=l*h*f-u*d*c,this._w=l*h*c+u*d*f;break;case"ZXY":this._x=u*h*c-l*d*f,this._y=l*d*c+u*h*f,this._z=l*h*f+u*d*c,this._w=l*h*c-u*d*f;break;case"ZYX":this._x=u*h*c-l*d*f,this._y=l*d*c+u*h*f,this._z=l*h*f-u*d*c,this._w=l*h*c+u*d*f;break;case"YZX":this._x=u*h*c+l*d*f,this._y=l*d*c+u*h*f,this._z=l*h*f-u*d*c,this._w=l*h*c-u*d*f;break;case"XZY":this._x=u*h*c-l*d*f,this._y=l*d*c-u*h*f,this._z=l*h*f+u*d*c,this._w=l*h*c+u*d*f;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+n)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let r=t/2,i=Math.sin(r);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(r),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,r=t[0],i=t[4],a=t[8],n=t[1],s=t[5],o=t[9],l=t[2],h=t[6],c=t[10],u=r+s+c;if(u>0){let d=.5/Math.sqrt(u+1);this._w=.25/d,this._x=(h-o)*d,this._y=(a-l)*d,this._z=(n-i)*d}else if(r>s&&r>c){let d=2*Math.sqrt(1+r-s-c);this._w=(h-o)/d,this._x=.25*d,this._y=(i+n)/d,this._z=(a+l)/d}else if(s>c){let d=2*Math.sqrt(1+s-r-c);this._w=(a-l)/d,this._x=(i+n)/d,this._y=.25*d,this._z=(o+h)/d}else{let d=2*Math.sqrt(1+c-r-s);this._w=(n-i)/d,this._x=(a+l)/d,this._y=(o+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let r=e.dot(t)+1;return r<1e-8?(r=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=r):(this._x=0,this._y=-e.z,this._z=e.y,this._w=r)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=r),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(ze(this.dot(e),-1,1)))}rotateTowards(e,t){let r=this.angleTo(e);if(r===0)return this;let i=Math.min(1,t/r);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let r=e._x,i=e._y,a=e._z,n=e._w,s=t._x,o=t._y,l=t._z,h=t._w;return this._x=r*h+n*s+i*l-a*o,this._y=i*h+n*o+a*s-r*l,this._z=a*h+n*l+r*o-i*s,this._w=n*h-r*s-i*o-a*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let r=this._x,i=this._y,a=this._z,n=this._w,s=n*e._w+r*e._x+i*e._y+a*e._z;if(s<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,s=-s):this.copy(e),s>=1)return this._w=n,this._x=r,this._y=i,this._z=a,this;let o=1-s*s;if(o<=Number.EPSILON){let d=1-t;return this._w=d*n+t*this._w,this._x=d*r+t*this._x,this._y=d*i+t*this._y,this._z=d*a+t*this._z,this.normalize(),this}let l=Math.sqrt(o),h=Math.atan2(l,s),c=Math.sin((1-t)*h)/l,u=Math.sin(t*h)/l;return this._w=n*c+this._w*u,this._x=r*c+this._x*u,this._y=i*c+this._y*u,this._z=a*c+this._z*u,this._onChangeCallback(),this}slerpQuaternions(e,t,r){return this.copy(e).slerp(t,r)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),r=Math.random(),i=Math.sqrt(1-r),a=Math.sqrt(r);return this.set(i*Math.sin(e),i*Math.cos(e),a*Math.sin(t),a*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},L=class al{constructor(t=0,r=0,i=0){al.prototype.isVector3=!0,this.x=t,this.y=r,this.z=i}set(t,r,i){return i===void 0&&(i=this.z),this.x=t,this.y=r,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,r){switch(t){case 0:this.x=r;break;case 1:this.y=r;break;case 2:this.z=r;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,r){return this.x=t.x+r.x,this.y=t.y+r.y,this.z=t.z+r.z,this}addScaledVector(t,r){return this.x+=t.x*r,this.y+=t.y*r,this.z+=t.z*r,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,r){return this.x=t.x-r.x,this.y=t.y-r.y,this.z=t.z-r.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,r){return this.x=t.x*r.x,this.y=t.y*r.y,this.z=t.z*r.z,this}applyEuler(t){return this.applyQuaternion(ks.setFromEuler(t))}applyAxisAngle(t,r){return this.applyQuaternion(ks.setFromAxisAngle(t,r))}applyMatrix3(t){let r=this.x,i=this.y,a=this.z,n=t.elements;return this.x=n[0]*r+n[3]*i+n[6]*a,this.y=n[1]*r+n[4]*i+n[7]*a,this.z=n[2]*r+n[5]*i+n[8]*a,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let r=this.x,i=this.y,a=this.z,n=t.elements,s=1/(n[3]*r+n[7]*i+n[11]*a+n[15]);return this.x=(n[0]*r+n[4]*i+n[8]*a+n[12])*s,this.y=(n[1]*r+n[5]*i+n[9]*a+n[13])*s,this.z=(n[2]*r+n[6]*i+n[10]*a+n[14])*s,this}applyQuaternion(t){let r=this.x,i=this.y,a=this.z,n=t.x,s=t.y,o=t.z,l=t.w,h=2*(s*a-o*i),c=2*(o*r-n*a),u=2*(n*i-s*r);return this.x=r+l*h+s*u-o*c,this.y=i+l*c+o*h-n*u,this.z=a+l*u+n*c-s*h,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let r=this.x,i=this.y,a=this.z,n=t.elements;return this.x=n[0]*r+n[4]*i+n[8]*a,this.y=n[1]*r+n[5]*i+n[9]*a,this.z=n[2]*r+n[6]*i+n[10]*a,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,r){return this.x=ze(this.x,t.x,r.x),this.y=ze(this.y,t.y,r.y),this.z=ze(this.z,t.z,r.z),this}clampScalar(t,r){return this.x=ze(this.x,t,r),this.y=ze(this.y,t,r),this.z=ze(this.z,t,r),this}clampLength(t,r){let i=this.length();return this.divideScalar(i||1).multiplyScalar(ze(i,t,r))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,r){return this.x+=(t.x-this.x)*r,this.y+=(t.y-this.y)*r,this.z+=(t.z-this.z)*r,this}lerpVectors(t,r,i){return this.x=t.x+(r.x-t.x)*i,this.y=t.y+(r.y-t.y)*i,this.z=t.z+(r.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,r){let i=t.x,a=t.y,n=t.z,s=r.x,o=r.y,l=r.z;return this.x=a*l-n*o,this.y=n*s-i*l,this.z=i*o-a*s,this}projectOnVector(t){let r=t.lengthSq();if(r===0)return this.set(0,0,0);let i=t.dot(this)/r;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return Sn.copy(this).projectOnVector(t),this.sub(Sn)}reflect(t){return this.sub(Sn.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let r=Math.sqrt(this.lengthSq()*t.lengthSq());if(r===0)return Math.PI/2;let i=this.dot(t)/r;return Math.acos(ze(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let r=this.x-t.x,i=this.y-t.y,a=this.z-t.z;return r*r+i*i+a*a}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,r,i){let a=Math.sin(r)*t;return this.x=a*Math.sin(i),this.y=Math.cos(r)*t,this.z=a*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,r,i){return this.x=t*Math.sin(r),this.y=i,this.z=t*Math.cos(r),this}setFromMatrixPosition(t){let r=t.elements;return this.x=r[12],this.y=r[13],this.z=r[14],this}setFromMatrixScale(t){let r=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),a=this.setFromMatrixColumn(t,2).length();return this.x=r,this.y=i,this.z=a,this}setFromMatrixColumn(t,r){return this.fromArray(t.elements,r*4)}setFromMatrix3Column(t,r){return this.fromArray(t.elements,r*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,r=0){return this.x=t[r],this.y=t[r+1],this.z=t[r+2],this}toArray(t=[],r=0){return t[r]=this.x,t[r+1]=this.y,t[r+2]=this.z,t}fromBufferAttribute(t,r){return this.x=t.getX(r),this.y=t.getY(r),this.z=t.getZ(r),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,r=Math.random()*2-1,i=Math.sqrt(1-r*r);return this.x=i*Math.cos(t),this.y=r,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Sn=new L,ks=new Wr,He=class nl{constructor(t,r,i,a,n,s,o,l,h){nl.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,r,i,a,n,s,o,l,h)}set(t,r,i,a,n,s,o,l,h){let c=this.elements;return c[0]=t,c[1]=a,c[2]=o,c[3]=r,c[4]=n,c[5]=l,c[6]=i,c[7]=s,c[8]=h,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let r=this.elements,i=t.elements;return r[0]=i[0],r[1]=i[1],r[2]=i[2],r[3]=i[3],r[4]=i[4],r[5]=i[5],r[6]=i[6],r[7]=i[7],r[8]=i[8],this}extractBasis(t,r,i){return t.setFromMatrix3Column(this,0),r.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let r=t.elements;return this.set(r[0],r[4],r[8],r[1],r[5],r[9],r[2],r[6],r[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,r){let i=t.elements,a=r.elements,n=this.elements,s=i[0],o=i[3],l=i[6],h=i[1],c=i[4],u=i[7],d=i[2],f=i[5],x=i[8],_=a[0],m=a[3],p=a[6],b=a[1],M=a[4],T=a[7],D=a[2],w=a[5],A=a[8];return n[0]=s*_+o*b+l*D,n[3]=s*m+o*M+l*w,n[6]=s*p+o*T+l*A,n[1]=h*_+c*b+u*D,n[4]=h*m+c*M+u*w,n[7]=h*p+c*T+u*A,n[2]=d*_+f*b+x*D,n[5]=d*m+f*M+x*w,n[8]=d*p+f*T+x*A,this}multiplyScalar(t){let r=this.elements;return r[0]*=t,r[3]*=t,r[6]*=t,r[1]*=t,r[4]*=t,r[7]*=t,r[2]*=t,r[5]*=t,r[8]*=t,this}determinant(){let t=this.elements,r=t[0],i=t[1],a=t[2],n=t[3],s=t[4],o=t[5],l=t[6],h=t[7],c=t[8];return r*s*c-r*o*h-i*n*c+i*o*l+a*n*h-a*s*l}invert(){let t=this.elements,r=t[0],i=t[1],a=t[2],n=t[3],s=t[4],o=t[5],l=t[6],h=t[7],c=t[8],u=c*s-o*h,d=o*l-c*n,f=h*n-s*l,x=r*u+i*d+a*f;if(x===0)return this.set(0,0,0,0,0,0,0,0,0);let _=1/x;return t[0]=u*_,t[1]=(a*h-c*i)*_,t[2]=(o*i-a*s)*_,t[3]=d*_,t[4]=(c*r-a*l)*_,t[5]=(a*n-o*r)*_,t[6]=f*_,t[7]=(i*l-h*r)*_,t[8]=(s*r-i*n)*_,this}transpose(){let t,r=this.elements;return t=r[1],r[1]=r[3],r[3]=t,t=r[2],r[2]=r[6],r[6]=t,t=r[5],r[5]=r[7],r[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let r=this.elements;return t[0]=r[0],t[1]=r[3],t[2]=r[6],t[3]=r[1],t[4]=r[4],t[5]=r[7],t[6]=r[2],t[7]=r[5],t[8]=r[8],this}setUvTransform(t,r,i,a,n,s,o){let l=Math.cos(n),h=Math.sin(n);return this.set(i*l,i*h,-i*(l*s+h*o)+s+t,-a*h,a*l,-a*(-h*s+l*o)+o+r,0,0,1),this}scale(t,r){return this.premultiply(En.makeScale(t,r)),this}rotate(t){return this.premultiply(En.makeRotation(-t)),this}translate(t,r){return this.premultiply(En.makeTranslation(t,r)),this}makeTranslation(t,r){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,r,0,0,1),this}makeRotation(t){let r=Math.cos(t),i=Math.sin(t);return this.set(r,-i,0,i,r,0,0,0,1),this}makeScale(t,r){return this.set(t,0,0,0,r,0,0,0,1),this}equals(t){let r=this.elements,i=t.elements;for(let a=0;a<9;a++)if(r[a]!==i[a])return!1;return!0}fromArray(t,r=0){for(let i=0;i<9;i++)this.elements[i]=t[i+r];return this}toArray(t=[],r=0){let i=this.elements;return t[r]=i[0],t[r+1]=i[1],t[r+2]=i[2],t[r+3]=i[3],t[r+4]=i[4],t[r+5]=i[5],t[r+6]=i[6],t[r+7]=i[7],t[r+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}},En=new He;function Ws(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function ji(e){return document.createElementNS("http://www.w3.org/1999/xhtml",e)}function bh(){let e=ji("canvas");return e.style.display="block",e}var Xs={};function Xr(e){e in Xs||(Xs[e]=!0,console.warn(e))}function wh(e,t,r){return new Promise(function(i,a){function n(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:a();break;case e.TIMEOUT_EXPIRED:setTimeout(n,r);break;default:i()}}setTimeout(n,r)})}var js=new He().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),qs=new He().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Ah(){let e={enabled:!0,workingColorSpace:zr,spaces:{},convert:function(a,n,s){return this.enabled===!1||n===s||!n||!s||(this.spaces[n].transfer===Ye&&(a.r=er(a.r),a.g=er(a.g),a.b=er(a.b)),this.spaces[n].primaries!==this.spaces[s].primaries&&(a.applyMatrix3(this.spaces[n].toXYZ),a.applyMatrix3(this.spaces[s].fromXYZ)),this.spaces[s].transfer===Ye&&(a.r=jr(a.r),a.g=jr(a.g),a.b=jr(a.b))),a},workingToColorSpace:function(a,n){return this.convert(a,this.workingColorSpace,n)},colorSpaceToWorking:function(a,n){return this.convert(a,n,this.workingColorSpace)},getPrimaries:function(a){return this.spaces[a].primaries},getTransfer:function(a){return a===cr?Wi:this.spaces[a].transfer},getLuminanceCoefficients:function(a,n=this.workingColorSpace){return a.fromArray(this.spaces[n].luminanceCoefficients)},define:function(a){Object.assign(this.spaces,a)},_getMatrix:function(a,n,s){return a.copy(this.spaces[n].toXYZ).multiply(this.spaces[s].fromXYZ)},_getDrawingBufferColorSpace:function(a){return this.spaces[a].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(a=this.workingColorSpace){return this.spaces[a].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(a,n){return Xr("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),e.workingToColorSpace(a,n)},toWorkingColorSpace:function(a,n){return Xr("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),e.colorSpaceToWorking(a,n)}},t=[.64,.33,.3,.6,.15,.06],r=[.2126,.7152,.0722],i=[.3127,.329];return e.define({[zr]:{primaries:t,whitePoint:i,transfer:Wi,toXYZ:js,fromXYZ:qs,luminanceCoefficients:r,workingColorSpaceConfig:{unpackColorSpace:yt},outputColorSpaceConfig:{drawingBufferColorSpace:yt}},[yt]:{primaries:t,whitePoint:i,transfer:Ye,toXYZ:js,fromXYZ:qs,luminanceCoefficients:r,outputColorSpaceConfig:{drawingBufferColorSpace:yt}}}),e}var Xe=Ah();function er(e){return e<.04045?e*.0773993808:Math.pow(e*.9478672986+.0521327014,2.4)}function jr(e){return e<.0031308?e*12.92:1.055*Math.pow(e,.41666)-.055}var qr,Rh=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let r;if(e instanceof HTMLCanvasElement)r=e;else{qr===void 0&&(qr=ji("canvas")),qr.width=e.width,qr.height=e.height;let i=qr.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),r=qr}return r.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=ji("canvas");t.width=e.width,t.height=e.height;let r=t.getContext("2d");r.drawImage(e,0,0,e.width,e.height);let i=r.getImageData(0,0,e.width,e.height),a=i.data;for(let n=0;n<a.length;n++)a[n]=er(a[n]/255)*255;return r.putImageData(i,0,0),t}else if(e.data){let t=e.data.slice(0);for(let r=0;r<t.length;r++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[r]=Math.floor(er(t[r]/255)*255):t[r]=er(t[r]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Ch=0,Tn=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Ch++}),this.uuid=Gr(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let r={uuid:this.uuid,url:""},i=this.data;if(i!==null){let a;if(Array.isArray(i)){a=[];for(let n=0,s=i.length;n<s;n++)i[n].isDataTexture?a.push(bn(i[n].image)):a.push(bn(i[n]))}else a=bn(i);r.url=a}return t||(e.images[this.uuid]=r),r}};function bn(e){return typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap?Rh.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var Ph=0,wn=new L,It=class Sa extends Vr{constructor(t=Sa.DEFAULT_IMAGE,r=Sa.DEFAULT_MAPPING,i=Mr,a=Mr,n=Gt,s=Sr,o=Dt,l=kt,h=Sa.DEFAULT_ANISOTROPY,c=cr){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Ph++}),this.uuid=Gr(),this.name="",this.source=new Tn(t),this.mipmaps=[],this.mapping=r,this.channel=0,this.wrapS=i,this.wrapT=a,this.magFilter=n,this.minFilter=s,this.anisotropy=h,this.format=o,this.internalFormat=null,this.type=l,this.offset=new we(0,0),this.repeat=new we(1,1),this.center=new we(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new He,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=c,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(wn).x}get height(){return this.source.getSize(wn).y}get depth(){return this.source.getSize(wn).z}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,r){this.updateRanges.push({start:t,count:r})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let r in t){let i=t[r];if(i===void 0){console.warn(`THREE.Texture.setValues(): parameter '${r}' has value of undefined.`);continue}let a=this[r];if(a===void 0){console.warn(`THREE.Texture.setValues(): property '${r}' does not exist.`);continue}a&&i&&a.isVector2&&i.isVector2||a&&i&&a.isVector3&&i.isVector3||a&&i&&a.isMatrix3&&i.isMatrix3?a.copy(i):this[r]=i}}toJSON(t){let r=t===void 0||typeof t=="string";if(!r&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),r||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==bs)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Oi:t.x=t.x-Math.floor(t.x);break;case Mr:t.x=t.x<0?0:1;break;case Ba:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Oi:t.y=t.y-Math.floor(t.y);break;case Mr:t.y=t.y<0?0:1;break;case Ba:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};It.DEFAULT_IMAGE=null,It.DEFAULT_MAPPING=bs,It.DEFAULT_ANISOTROPY=1;var ot=class sl{constructor(t=0,r=0,i=0,a=1){sl.prototype.isVector4=!0,this.x=t,this.y=r,this.z=i,this.w=a}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,r,i,a){return this.x=t,this.y=r,this.z=i,this.w=a,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,r){switch(t){case 0:this.x=r;break;case 1:this.y=r;break;case 2:this.z=r;break;case 3:this.w=r;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,r){return this.x=t.x+r.x,this.y=t.y+r.y,this.z=t.z+r.z,this.w=t.w+r.w,this}addScaledVector(t,r){return this.x+=t.x*r,this.y+=t.y*r,this.z+=t.z*r,this.w+=t.w*r,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,r){return this.x=t.x-r.x,this.y=t.y-r.y,this.z=t.z-r.z,this.w=t.w-r.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let r=this.x,i=this.y,a=this.z,n=this.w,s=t.elements;return this.x=s[0]*r+s[4]*i+s[8]*a+s[12]*n,this.y=s[1]*r+s[5]*i+s[9]*a+s[13]*n,this.z=s[2]*r+s[6]*i+s[10]*a+s[14]*n,this.w=s[3]*r+s[7]*i+s[11]*a+s[15]*n,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let r=Math.sqrt(1-t.w*t.w);return r<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/r,this.y=t.y/r,this.z=t.z/r),this}setAxisAngleFromRotationMatrix(t){let r,i,a,n,s=t.elements,o=s[0],l=s[4],h=s[8],c=s[1],u=s[5],d=s[9],f=s[2],x=s[6],_=s[10];if(Math.abs(l-c)<.01&&Math.abs(h-f)<.01&&Math.abs(d-x)<.01){if(Math.abs(l+c)<.1&&Math.abs(h+f)<.1&&Math.abs(d+x)<.1&&Math.abs(o+u+_-3)<.1)return this.set(1,0,0,0),this;r=Math.PI;let p=(o+1)/2,b=(u+1)/2,M=(_+1)/2,T=(l+c)/4,D=(h+f)/4,w=(d+x)/4;return p>b&&p>M?p<.01?(i=0,a=.707106781,n=.707106781):(i=Math.sqrt(p),a=T/i,n=D/i):b>M?b<.01?(i=.707106781,a=0,n=.707106781):(a=Math.sqrt(b),i=T/a,n=w/a):M<.01?(i=.707106781,a=.707106781,n=0):(n=Math.sqrt(M),i=D/n,a=w/n),this.set(i,a,n,r),this}let m=Math.sqrt((x-d)*(x-d)+(h-f)*(h-f)+(c-l)*(c-l));return Math.abs(m)<.001&&(m=1),this.x=(x-d)/m,this.y=(h-f)/m,this.z=(c-l)/m,this.w=Math.acos((o+u+_-1)/2),this}setFromMatrixPosition(t){let r=t.elements;return this.x=r[12],this.y=r[13],this.z=r[14],this.w=r[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,r){return this.x=ze(this.x,t.x,r.x),this.y=ze(this.y,t.y,r.y),this.z=ze(this.z,t.z,r.z),this.w=ze(this.w,t.w,r.w),this}clampScalar(t,r){return this.x=ze(this.x,t,r),this.y=ze(this.y,t,r),this.z=ze(this.z,t,r),this.w=ze(this.w,t,r),this}clampLength(t,r){let i=this.length();return this.divideScalar(i||1).multiplyScalar(ze(i,t,r))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,r){return this.x+=(t.x-this.x)*r,this.y+=(t.y-this.y)*r,this.z+=(t.z-this.z)*r,this.w+=(t.w-this.w)*r,this}lerpVectors(t,r,i){return this.x=t.x+(r.x-t.x)*i,this.y=t.y+(r.y-t.y)*i,this.z=t.z+(r.z-t.z)*i,this.w=t.w+(r.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,r=0){return this.x=t[r],this.y=t[r+1],this.z=t[r+2],this.w=t[r+3],this}toArray(t=[],r=0){return t[r]=this.x,t[r+1]=this.y,t[r+2]=this.z,t[r+3]=this.w,t}fromBufferAttribute(t,r){return this.x=t.getX(r),this.y=t.getY(r),this.z=t.getZ(r),this.w=t.getW(r),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Uh=class extends Vr{constructor(e=1,t=1,r={}){super(),r=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Gt,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},r),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=r.depth,this.scissor=new ot(0,0,e,t),this.scissorTest=!1,this.viewport=new ot(0,0,e,t);let i={width:e,height:t,depth:r.depth},a=new It(i);this.textures=[];let n=r.count;for(let s=0;s<n;s++)this.textures[s]=a.clone(),this.textures[s].isRenderTargetTexture=!0,this.textures[s].renderTarget=this;this._setTextureOptions(r),this.depthBuffer=r.depthBuffer,this.stencilBuffer=r.stencilBuffer,this.resolveDepthBuffer=r.resolveDepthBuffer,this.resolveStencilBuffer=r.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=r.depthTexture,this.samples=r.samples,this.multiview=r.multiview}_setTextureOptions(e={}){let t={minFilter:Gt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let r=0;r<this.textures.length;r++)this.textures[r].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,r=1){if(this.width!==e||this.height!==t||this.depth!==r){this.width=e,this.height=t,this.depth=r;for(let i=0,a=this.textures.length;i<a;i++)this.textures[i].image.width=e,this.textures[i].image.height=t,this.textures[i].image.depth=r,this.textures[i].isArrayTexture=this.textures[i].image.depth>1;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,r=e.textures.length;t<r;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let i=Object.assign({},e.textures[t].image);this.textures[t].source=new Tn(i)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Tr=class extends Uh{constructor(e=1,t=1,r={}){super(e,t,r),this.isWebGLRenderTarget=!0}},Ys=class extends It{constructor(e=null,t=1,r=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:r,depth:i},this.magFilter=Lt,this.minFilter=Lt,this.wrapR=Mr,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},Lh=class extends It{constructor(e=null,t=1,r=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:r,depth:i},this.magFilter=Lt,this.minFilter=Lt,this.wrapR=Mr,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},yi=class{constructor(e=new L(1/0,1/0,1/0),t=new L(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,r=e.length;t<r;t+=3)this.expandByPoint(Nt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,r=e.count;t<r;t++)this.expandByPoint(Nt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,r=e.length;t<r;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let r=Nt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(r),this.max.copy(e).add(r),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let r=e.geometry;if(r!==void 0){let a=r.getAttribute("position");if(t===!0&&a!==void 0&&e.isInstancedMesh!==!0)for(let n=0,s=a.count;n<s;n++)e.isMesh===!0?e.getVertexPosition(n,Nt):Nt.fromBufferAttribute(a,n),Nt.applyMatrix4(e.matrixWorld),this.expandByPoint(Nt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),qi.copy(e.boundingBox)):(r.boundingBox===null&&r.computeBoundingBox(),qi.copy(r.boundingBox)),qi.applyMatrix4(e.matrixWorld),this.union(qi)}let i=e.children;for(let a=0,n=i.length;a<n;a++)this.expandByObject(i[a],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Nt),Nt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,r;return e.normal.x>0?(t=e.normal.x*this.min.x,r=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,r=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,r+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,r+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,r+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,r+=e.normal.z*this.min.z),t<=-e.constant&&r>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Mi),Yi.subVectors(this.max,Mi),Yr.subVectors(e.a,Mi),Zr.subVectors(e.b,Mi),Kr.subVectors(e.c,Mi),ur.subVectors(Zr,Yr),dr.subVectors(Kr,Zr),br.subVectors(Yr,Kr);let t=[0,-ur.z,ur.y,0,-dr.z,dr.y,0,-br.z,br.y,ur.z,0,-ur.x,dr.z,0,-dr.x,br.z,0,-br.x,-ur.y,ur.x,0,-dr.y,dr.x,0,-br.y,br.x,0];return!An(t,Yr,Zr,Kr,Yi)||(t=[1,0,0,0,1,0,0,0,1],!An(t,Yr,Zr,Kr,Yi))?!1:(Zi.crossVectors(ur,dr),t=[Zi.x,Zi.y,Zi.z],An(t,Yr,Zr,Kr,Yi))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Nt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Nt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(tr[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),tr[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),tr[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),tr[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),tr[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),tr[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),tr[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),tr[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(tr),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},tr=[new L,new L,new L,new L,new L,new L,new L,new L],Nt=new L,qi=new yi,Yr=new L,Zr=new L,Kr=new L,ur=new L,dr=new L,br=new L,Mi=new L,Yi=new L,Zi=new L,wr=new L;function An(e,t,r,i,a){for(let n=0,s=e.length-3;n<=s;n+=3){wr.fromArray(e,n);let o=a.x*Math.abs(wr.x)+a.y*Math.abs(wr.y)+a.z*Math.abs(wr.z),l=t.dot(wr),h=r.dot(wr),c=i.dot(wr);if(Math.max(-Math.max(l,h,c),Math.min(l,h,c))>o)return!1}return!0}var Dh=new yi,Si=new L,Rn=new L,Cn=class{constructor(e=new L,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let r=this.center;t!==void 0?r.copy(t):Dh.setFromPoints(e).getCenter(r);let i=0;for(let a=0,n=e.length;a<n;a++)i=Math.max(i,r.distanceToSquared(e[a]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let r=this.center.distanceToSquared(e);return t.copy(e),r>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Si.subVectors(e,this.center);let t=Si.lengthSq();if(t>this.radius*this.radius){let r=Math.sqrt(t),i=(r-this.radius)*.5;this.center.addScaledVector(Si,i/r),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Rn.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Si.copy(e.center).add(Rn)),this.expandByPoint(Si.copy(e.center).sub(Rn))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},rr=new L,Pn=new L,Ki=new L,pr=new L,Un=new L,Ji=new L,Ln=new L,Ih=class{constructor(e=new L,t=new L(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,rr)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let r=t.dot(this.direction);return r<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,r)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=rr.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(rr.copy(this.origin).addScaledVector(this.direction,t),rr.distanceToSquared(e))}distanceSqToSegment(e,t,r,i){Pn.copy(e).add(t).multiplyScalar(.5),Ki.copy(t).sub(e).normalize(),pr.copy(this.origin).sub(Pn);let a=e.distanceTo(t)*.5,n=-this.direction.dot(Ki),s=pr.dot(this.direction),o=-pr.dot(Ki),l=pr.lengthSq(),h=Math.abs(1-n*n),c,u,d,f;if(h>0)if(c=n*o-s,u=n*s-o,f=a*h,c>=0)if(u>=-f)if(u<=f){let x=1/h;c*=x,u*=x,d=c*(c+n*u+2*s)+u*(n*c+u+2*o)+l}else u=a,c=Math.max(0,-(n*u+s)),d=-c*c+u*(u+2*o)+l;else u=-a,c=Math.max(0,-(n*u+s)),d=-c*c+u*(u+2*o)+l;else u<=-f?(c=Math.max(0,-(-n*a+s)),u=c>0?-a:Math.min(Math.max(-a,-o),a),d=-c*c+u*(u+2*o)+l):u<=f?(c=0,u=Math.min(Math.max(-a,-o),a),d=u*(u+2*o)+l):(c=Math.max(0,-(n*a+s)),u=c>0?a:Math.min(Math.max(-a,-o),a),d=-c*c+u*(u+2*o)+l);else u=n>0?-a:a,c=Math.max(0,-(n*u+s)),d=-c*c+u*(u+2*o)+l;return r&&r.copy(this.origin).addScaledVector(this.direction,c),i&&i.copy(Pn).addScaledVector(Ki,u),d}intersectSphere(e,t){rr.subVectors(e.center,this.origin);let r=rr.dot(this.direction),i=rr.dot(rr)-r*r,a=e.radius*e.radius;if(i>a)return null;let n=Math.sqrt(a-i),s=r-n,o=r+n;return o<0?null:s<0?this.at(o,t):this.at(s,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let r=-(this.origin.dot(e.normal)+e.constant)/t;return r>=0?r:null}intersectPlane(e,t){let r=this.distanceToPlane(e);return r===null?null:this.at(r,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let r,i,a,n,s,o,l=1/this.direction.x,h=1/this.direction.y,c=1/this.direction.z,u=this.origin;return l>=0?(r=(e.min.x-u.x)*l,i=(e.max.x-u.x)*l):(r=(e.max.x-u.x)*l,i=(e.min.x-u.x)*l),h>=0?(a=(e.min.y-u.y)*h,n=(e.max.y-u.y)*h):(a=(e.max.y-u.y)*h,n=(e.min.y-u.y)*h),r>n||a>i||((a>r||isNaN(r))&&(r=a),(n<i||isNaN(i))&&(i=n),c>=0?(s=(e.min.z-u.z)*c,o=(e.max.z-u.z)*c):(s=(e.max.z-u.z)*c,o=(e.min.z-u.z)*c),r>o||s>i)||((s>r||r!==r)&&(r=s),(o<i||i!==i)&&(i=o),i<0)?null:this.at(r>=0?r:i,t)}intersectsBox(e){return this.intersectBox(e,rr)!==null}intersectTriangle(e,t,r,i,a){Un.subVectors(t,e),Ji.subVectors(r,e),Ln.crossVectors(Un,Ji);let n=this.direction.dot(Ln),s;if(n>0){if(i)return null;s=1}else if(n<0)s=-1,n=-n;else return null;pr.subVectors(this.origin,e);let o=s*this.direction.dot(Ji.crossVectors(pr,Ji));if(o<0)return null;let l=s*this.direction.dot(Un.cross(pr));if(l<0||o+l>n)return null;let h=-s*pr.dot(Ln);return h<0?null:this.at(h/n,a)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ht=class ps{constructor(t,r,i,a,n,s,o,l,h,c,u,d,f,x,_,m){ps.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,r,i,a,n,s,o,l,h,c,u,d,f,x,_,m)}set(t,r,i,a,n,s,o,l,h,c,u,d,f,x,_,m){let p=this.elements;return p[0]=t,p[4]=r,p[8]=i,p[12]=a,p[1]=n,p[5]=s,p[9]=o,p[13]=l,p[2]=h,p[6]=c,p[10]=u,p[14]=d,p[3]=f,p[7]=x,p[11]=_,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ps().fromArray(this.elements)}copy(t){let r=this.elements,i=t.elements;return r[0]=i[0],r[1]=i[1],r[2]=i[2],r[3]=i[3],r[4]=i[4],r[5]=i[5],r[6]=i[6],r[7]=i[7],r[8]=i[8],r[9]=i[9],r[10]=i[10],r[11]=i[11],r[12]=i[12],r[13]=i[13],r[14]=i[14],r[15]=i[15],this}copyPosition(t){let r=this.elements,i=t.elements;return r[12]=i[12],r[13]=i[13],r[14]=i[14],this}setFromMatrix3(t){let r=t.elements;return this.set(r[0],r[3],r[6],0,r[1],r[4],r[7],0,r[2],r[5],r[8],0,0,0,0,1),this}extractBasis(t,r,i){return t.setFromMatrixColumn(this,0),r.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(t,r,i){return this.set(t.x,r.x,i.x,0,t.y,r.y,i.y,0,t.z,r.z,i.z,0,0,0,0,1),this}extractRotation(t){let r=this.elements,i=t.elements,a=1/Jr.setFromMatrixColumn(t,0).length(),n=1/Jr.setFromMatrixColumn(t,1).length(),s=1/Jr.setFromMatrixColumn(t,2).length();return r[0]=i[0]*a,r[1]=i[1]*a,r[2]=i[2]*a,r[3]=0,r[4]=i[4]*n,r[5]=i[5]*n,r[6]=i[6]*n,r[7]=0,r[8]=i[8]*s,r[9]=i[9]*s,r[10]=i[10]*s,r[11]=0,r[12]=0,r[13]=0,r[14]=0,r[15]=1,this}makeRotationFromEuler(t){let r=this.elements,i=t.x,a=t.y,n=t.z,s=Math.cos(i),o=Math.sin(i),l=Math.cos(a),h=Math.sin(a),c=Math.cos(n),u=Math.sin(n);if(t.order==="XYZ"){let d=s*c,f=s*u,x=o*c,_=o*u;r[0]=l*c,r[4]=-l*u,r[8]=h,r[1]=f+x*h,r[5]=d-_*h,r[9]=-o*l,r[2]=_-d*h,r[6]=x+f*h,r[10]=s*l}else if(t.order==="YXZ"){let d=l*c,f=l*u,x=h*c,_=h*u;r[0]=d+_*o,r[4]=x*o-f,r[8]=s*h,r[1]=s*u,r[5]=s*c,r[9]=-o,r[2]=f*o-x,r[6]=_+d*o,r[10]=s*l}else if(t.order==="ZXY"){let d=l*c,f=l*u,x=h*c,_=h*u;r[0]=d-_*o,r[4]=-s*u,r[8]=x+f*o,r[1]=f+x*o,r[5]=s*c,r[9]=_-d*o,r[2]=-s*h,r[6]=o,r[10]=s*l}else if(t.order==="ZYX"){let d=s*c,f=s*u,x=o*c,_=o*u;r[0]=l*c,r[4]=x*h-f,r[8]=d*h+_,r[1]=l*u,r[5]=_*h+d,r[9]=f*h-x,r[2]=-h,r[6]=o*l,r[10]=s*l}else if(t.order==="YZX"){let d=s*l,f=s*h,x=o*l,_=o*h;r[0]=l*c,r[4]=_-d*u,r[8]=x*u+f,r[1]=u,r[5]=s*c,r[9]=-o*c,r[2]=-h*c,r[6]=f*u+x,r[10]=d-_*u}else if(t.order==="XZY"){let d=s*l,f=s*h,x=o*l,_=o*h;r[0]=l*c,r[4]=-u,r[8]=h*c,r[1]=d*u+_,r[5]=s*c,r[9]=f*u-x,r[2]=x*u-f,r[6]=o*c,r[10]=_*u+d}return r[3]=0,r[7]=0,r[11]=0,r[12]=0,r[13]=0,r[14]=0,r[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Nh,t,Oh)}lookAt(t,r,i){let a=this.elements;return St.subVectors(t,r),St.lengthSq()===0&&(St.z=1),St.normalize(),fr.crossVectors(i,St),fr.lengthSq()===0&&(Math.abs(i.z)===1?St.x+=1e-4:St.z+=1e-4,St.normalize(),fr.crossVectors(i,St)),fr.normalize(),$i.crossVectors(St,fr),a[0]=fr.x,a[4]=$i.x,a[8]=St.x,a[1]=fr.y,a[5]=$i.y,a[9]=St.y,a[2]=fr.z,a[6]=$i.z,a[10]=St.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,r){let i=t.elements,a=r.elements,n=this.elements,s=i[0],o=i[4],l=i[8],h=i[12],c=i[1],u=i[5],d=i[9],f=i[13],x=i[2],_=i[6],m=i[10],p=i[14],b=i[3],M=i[7],T=i[11],D=i[15],w=a[0],A=a[4],O=a[8],E=a[12],y=a[1],U=a[5],V=a[9],B=a[13],X=a[2],Y=a[6],k=a[10],$=a[14],q=a[3],K=a[7],me=a[11],De=a[15];return n[0]=s*w+o*y+l*X+h*q,n[4]=s*A+o*U+l*Y+h*K,n[8]=s*O+o*V+l*k+h*me,n[12]=s*E+o*B+l*$+h*De,n[1]=c*w+u*y+d*X+f*q,n[5]=c*A+u*U+d*Y+f*K,n[9]=c*O+u*V+d*k+f*me,n[13]=c*E+u*B+d*$+f*De,n[2]=x*w+_*y+m*X+p*q,n[6]=x*A+_*U+m*Y+p*K,n[10]=x*O+_*V+m*k+p*me,n[14]=x*E+_*B+m*$+p*De,n[3]=b*w+M*y+T*X+D*q,n[7]=b*A+M*U+T*Y+D*K,n[11]=b*O+M*V+T*k+D*me,n[15]=b*E+M*B+T*$+D*De,this}multiplyScalar(t){let r=this.elements;return r[0]*=t,r[4]*=t,r[8]*=t,r[12]*=t,r[1]*=t,r[5]*=t,r[9]*=t,r[13]*=t,r[2]*=t,r[6]*=t,r[10]*=t,r[14]*=t,r[3]*=t,r[7]*=t,r[11]*=t,r[15]*=t,this}determinant(){let t=this.elements,r=t[0],i=t[4],a=t[8],n=t[12],s=t[1],o=t[5],l=t[9],h=t[13],c=t[2],u=t[6],d=t[10],f=t[14],x=t[3],_=t[7],m=t[11],p=t[15];return x*(+n*l*u-a*h*u-n*o*d+i*h*d+a*o*f-i*l*f)+_*(+r*l*f-r*h*d+n*s*d-a*s*f+a*h*c-n*l*c)+m*(+r*h*u-r*o*f-n*s*u+i*s*f+n*o*c-i*h*c)+p*(-a*o*c-r*l*u+r*o*d+a*s*u-i*s*d+i*l*c)}transpose(){let t=this.elements,r;return r=t[1],t[1]=t[4],t[4]=r,r=t[2],t[2]=t[8],t[8]=r,r=t[6],t[6]=t[9],t[9]=r,r=t[3],t[3]=t[12],t[12]=r,r=t[7],t[7]=t[13],t[13]=r,r=t[11],t[11]=t[14],t[14]=r,this}setPosition(t,r,i){let a=this.elements;return t.isVector3?(a[12]=t.x,a[13]=t.y,a[14]=t.z):(a[12]=t,a[13]=r,a[14]=i),this}invert(){let t=this.elements,r=t[0],i=t[1],a=t[2],n=t[3],s=t[4],o=t[5],l=t[6],h=t[7],c=t[8],u=t[9],d=t[10],f=t[11],x=t[12],_=t[13],m=t[14],p=t[15],b=u*m*h-_*d*h+_*l*f-o*m*f-u*l*p+o*d*p,M=x*d*h-c*m*h-x*l*f+s*m*f+c*l*p-s*d*p,T=c*_*h-x*u*h+x*o*f-s*_*f-c*o*p+s*u*p,D=x*u*l-c*_*l-x*o*d+s*_*d+c*o*m-s*u*m,w=r*b+i*M+a*T+n*D;if(w===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/w;return t[0]=b*A,t[1]=(_*d*n-u*m*n-_*a*f+i*m*f+u*a*p-i*d*p)*A,t[2]=(o*m*n-_*l*n+_*a*h-i*m*h-o*a*p+i*l*p)*A,t[3]=(u*l*n-o*d*n-u*a*h+i*d*h+o*a*f-i*l*f)*A,t[4]=M*A,t[5]=(c*m*n-x*d*n+x*a*f-r*m*f-c*a*p+r*d*p)*A,t[6]=(x*l*n-s*m*n-x*a*h+r*m*h+s*a*p-r*l*p)*A,t[7]=(s*d*n-c*l*n+c*a*h-r*d*h-s*a*f+r*l*f)*A,t[8]=T*A,t[9]=(x*u*n-c*_*n-x*i*f+r*_*f+c*i*p-r*u*p)*A,t[10]=(s*_*n-x*o*n+x*i*h-r*_*h-s*i*p+r*o*p)*A,t[11]=(c*o*n-s*u*n-c*i*h+r*u*h+s*i*f-r*o*f)*A,t[12]=D*A,t[13]=(c*_*a-x*u*a+x*i*d-r*_*d-c*i*m+r*u*m)*A,t[14]=(x*o*a-s*_*a-x*i*l+r*_*l+s*i*m-r*o*m)*A,t[15]=(s*u*a-c*o*a+c*i*l-r*u*l-s*i*d+r*o*d)*A,this}scale(t){let r=this.elements,i=t.x,a=t.y,n=t.z;return r[0]*=i,r[4]*=a,r[8]*=n,r[1]*=i,r[5]*=a,r[9]*=n,r[2]*=i,r[6]*=a,r[10]*=n,r[3]*=i,r[7]*=a,r[11]*=n,this}getMaxScaleOnAxis(){let t=this.elements,r=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],a=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(r,i,a))}makeTranslation(t,r,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,r,0,0,1,i,0,0,0,1),this}makeRotationX(t){let r=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,r,-i,0,0,i,r,0,0,0,0,1),this}makeRotationY(t){let r=Math.cos(t),i=Math.sin(t);return this.set(r,0,i,0,0,1,0,0,-i,0,r,0,0,0,0,1),this}makeRotationZ(t){let r=Math.cos(t),i=Math.sin(t);return this.set(r,-i,0,0,i,r,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,r){let i=Math.cos(r),a=Math.sin(r),n=1-i,s=t.x,o=t.y,l=t.z,h=n*s,c=n*o;return this.set(h*s+i,h*o-a*l,h*l+a*o,0,h*o+a*l,c*o+i,c*l-a*s,0,h*l-a*o,c*l+a*s,n*l*l+i,0,0,0,0,1),this}makeScale(t,r,i){return this.set(t,0,0,0,0,r,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,r,i,a,n,s){return this.set(1,i,n,0,t,1,s,0,r,a,1,0,0,0,0,1),this}compose(t,r,i){let a=this.elements,n=r._x,s=r._y,o=r._z,l=r._w,h=n+n,c=s+s,u=o+o,d=n*h,f=n*c,x=n*u,_=s*c,m=s*u,p=o*u,b=l*h,M=l*c,T=l*u,D=i.x,w=i.y,A=i.z;return a[0]=(1-(_+p))*D,a[1]=(f+T)*D,a[2]=(x-M)*D,a[3]=0,a[4]=(f-T)*w,a[5]=(1-(d+p))*w,a[6]=(m+b)*w,a[7]=0,a[8]=(x+M)*A,a[9]=(m-b)*A,a[10]=(1-(d+_))*A,a[11]=0,a[12]=t.x,a[13]=t.y,a[14]=t.z,a[15]=1,this}decompose(t,r,i){let a=this.elements,n=Jr.set(a[0],a[1],a[2]).length(),s=Jr.set(a[4],a[5],a[6]).length(),o=Jr.set(a[8],a[9],a[10]).length();this.determinant()<0&&(n=-n),t.x=a[12],t.y=a[13],t.z=a[14],Ot.copy(this);let l=1/n,h=1/s,c=1/o;return Ot.elements[0]*=l,Ot.elements[1]*=l,Ot.elements[2]*=l,Ot.elements[4]*=h,Ot.elements[5]*=h,Ot.elements[6]*=h,Ot.elements[8]*=c,Ot.elements[9]*=c,Ot.elements[10]*=c,r.setFromRotationMatrix(Ot),i.x=n,i.y=s,i.z=o,this}makePerspective(t,r,i,a,n,s,o=Wt,l=!1){let h=this.elements,c=2*n/(r-t),u=2*n/(i-a),d=(r+t)/(r-t),f=(i+a)/(i-a),x,_;if(l)x=n/(s-n),_=s*n/(s-n);else if(o===Wt)x=-(s+n)/(s-n),_=-2*s*n/(s-n);else if(o===Xi)x=-s/(s-n),_=-s*n/(s-n);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return h[0]=c,h[4]=0,h[8]=d,h[12]=0,h[1]=0,h[5]=u,h[9]=f,h[13]=0,h[2]=0,h[6]=0,h[10]=x,h[14]=_,h[3]=0,h[7]=0,h[11]=-1,h[15]=0,this}makeOrthographic(t,r,i,a,n,s,o=Wt,l=!1){let h=this.elements,c=2/(r-t),u=2/(i-a),d=-(r+t)/(r-t),f=-(i+a)/(i-a),x,_;if(l)x=1/(s-n),_=s/(s-n);else if(o===Wt)x=-2/(s-n),_=-(s+n)/(s-n);else if(o===Xi)x=-1/(s-n),_=-n/(s-n);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return h[0]=c,h[4]=0,h[8]=0,h[12]=d,h[1]=0,h[5]=u,h[9]=0,h[13]=f,h[2]=0,h[6]=0,h[10]=x,h[14]=_,h[3]=0,h[7]=0,h[11]=0,h[15]=1,this}equals(t){let r=this.elements,i=t.elements;for(let a=0;a<16;a++)if(r[a]!==i[a])return!1;return!0}fromArray(t,r=0){for(let i=0;i<16;i++)this.elements[i]=t[i+r];return this}toArray(t=[],r=0){let i=this.elements;return t[r]=i[0],t[r+1]=i[1],t[r+2]=i[2],t[r+3]=i[3],t[r+4]=i[4],t[r+5]=i[5],t[r+6]=i[6],t[r+7]=i[7],t[r+8]=i[8],t[r+9]=i[9],t[r+10]=i[10],t[r+11]=i[11],t[r+12]=i[12],t[r+13]=i[13],t[r+14]=i[14],t[r+15]=i[15],t}},Jr=new L,Ot=new ht,Nh=new L(0,0,0),Oh=new L(1,1,1),fr=new L,$i=new L,St=new L,Zs=new ht,Ks=new Wr,mr=class ol{constructor(t=0,r=0,i=0,a=ol.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=r,this._z=i,this._order=a}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,r,i,a=this._order){return this._x=t,this._y=r,this._z=i,this._order=a,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,r=this._order,i=!0){let a=t.elements,n=a[0],s=a[4],o=a[8],l=a[1],h=a[5],c=a[9],u=a[2],d=a[6],f=a[10];switch(r){case"XYZ":this._y=Math.asin(ze(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-c,f),this._z=Math.atan2(-s,n)):(this._x=Math.atan2(d,h),this._z=0);break;case"YXZ":this._x=Math.asin(-ze(c,-1,1)),Math.abs(c)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(l,h)):(this._y=Math.atan2(-u,n),this._z=0);break;case"ZXY":this._x=Math.asin(ze(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-s,h)):(this._y=0,this._z=Math.atan2(l,n));break;case"ZYX":this._y=Math.asin(-ze(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,n)):(this._x=0,this._z=Math.atan2(-s,h));break;case"YZX":this._z=Math.asin(ze(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-c,h),this._y=Math.atan2(-u,n)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-ze(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(d,h),this._y=Math.atan2(o,n)):(this._x=Math.atan2(-c,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+r)}return this._order=r,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,r,i){return Zs.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Zs,r,i)}setFromVector3(t,r=this._order){return this.set(t.x,t.y,t.z,r)}reorder(t){return Ks.setFromEuler(this),this.setFromQuaternion(Ks,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],r=0){return t[r]=this._x,t[r+1]=this._y,t[r+2]=this._z,t[r+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};mr.DEFAULT_ORDER="XYZ";var Js=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Fh=0,$s=new L,$r=new Wr,ir=new ht,Qi=new L,Ei=new L,Bh=new L,zh=new Wr,Qs=new L(1,0,0),eo=new L(0,1,0),to=new L(0,0,1),ro={type:"added"},Hh={type:"removed"},Qr={type:"childadded",child:null},Dn={type:"childremoved",child:null},Et=class Ea extends Vr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Fh++}),this.uuid=Gr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Ea.DEFAULT_UP.clone();let t=new L,r=new mr,i=new Wr,a=new L(1,1,1);function n(){i.setFromEuler(r,!1)}function s(){r.setFromQuaternion(i,void 0,!1)}r._onChange(n),i._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:r},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:a},modelViewMatrix:{value:new ht},normalMatrix:{value:new He}}),this.matrix=new ht,this.matrixWorld=new ht,this.matrixAutoUpdate=Ea.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Ea.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Js,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,r){this.quaternion.setFromAxisAngle(t,r)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,r){return $r.setFromAxisAngle(t,r),this.quaternion.multiply($r),this}rotateOnWorldAxis(t,r){return $r.setFromAxisAngle(t,r),this.quaternion.premultiply($r),this}rotateX(t){return this.rotateOnAxis(Qs,t)}rotateY(t){return this.rotateOnAxis(eo,t)}rotateZ(t){return this.rotateOnAxis(to,t)}translateOnAxis(t,r){return $s.copy(t).applyQuaternion(this.quaternion),this.position.add($s.multiplyScalar(r)),this}translateX(t){return this.translateOnAxis(Qs,t)}translateY(t){return this.translateOnAxis(eo,t)}translateZ(t){return this.translateOnAxis(to,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(ir.copy(this.matrixWorld).invert())}lookAt(t,r,i){t.isVector3?Qi.copy(t):Qi.set(t,r,i);let a=this.parent;this.updateWorldMatrix(!0,!1),Ei.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ir.lookAt(Ei,Qi,this.up):ir.lookAt(Qi,Ei,this.up),this.quaternion.setFromRotationMatrix(ir),a&&(ir.extractRotation(a.matrixWorld),$r.setFromRotationMatrix(ir),this.quaternion.premultiply($r.invert()))}add(t){if(arguments.length>1){for(let r=0;r<arguments.length;r++)this.add(arguments[r]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(ro),Qr.child=t,this.dispatchEvent(Qr),Qr.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let r=this.children.indexOf(t);return r!==-1&&(t.parent=null,this.children.splice(r,1),t.dispatchEvent(Hh),Dn.child=t,this.dispatchEvent(Dn),Dn.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),ir.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),ir.multiply(t.parent.matrixWorld)),t.applyMatrix4(ir),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(ro),Qr.child=t,this.dispatchEvent(Qr),Qr.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,r){if(this[t]===r)return this;for(let i=0,a=this.children.length;i<a;i++){let n=this.children[i].getObjectByProperty(t,r);if(n!==void 0)return n}}getObjectsByProperty(t,r,i=[]){this[t]===r&&i.push(this);let a=this.children;for(let n=0,s=a.length;n<s;n++)a[n].getObjectsByProperty(t,r,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ei,t,Bh),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ei,zh,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let r=this.matrixWorld.elements;return t.set(r[8],r[9],r[10]).normalize()}raycast(){}traverse(t){t(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].traverseVisible(t)}traverseAncestors(t){let r=this.parent;r!==null&&(t(r),r.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].updateMatrixWorld(t)}updateWorldMatrix(t,r){let i=this.parent;if(t===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),r===!0){let a=this.children;for(let n=0,s=a.length;n<s;n++)a[n].updateWorldMatrix(!1,!0)}}toJSON(t){let r=t===void 0||typeof t=="string",i={};r&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let a={};a.uuid=this.uuid,a.type=this.type,this.name!==""&&(a.name=this.name),this.castShadow===!0&&(a.castShadow=!0),this.receiveShadow===!0&&(a.receiveShadow=!0),this.visible===!1&&(a.visible=!1),this.frustumCulled===!1&&(a.frustumCulled=!1),this.renderOrder!==0&&(a.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(a.userData=this.userData),a.layers=this.layers.mask,a.matrix=this.matrix.toArray(),a.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(a.matrixAutoUpdate=!1),this.isInstancedMesh&&(a.type="InstancedMesh",a.count=this.count,a.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(a.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(a.type="BatchedMesh",a.perObjectFrustumCulled=this.perObjectFrustumCulled,a.sortObjects=this.sortObjects,a.drawRanges=this._drawRanges,a.reservedRanges=this._reservedRanges,a.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),a.instanceInfo=this._instanceInfo.map(o=>({...o})),a.availableInstanceIds=this._availableInstanceIds.slice(),a.availableGeometryIds=this._availableGeometryIds.slice(),a.nextIndexStart=this._nextIndexStart,a.nextVertexStart=this._nextVertexStart,a.geometryCount=this._geometryCount,a.maxInstanceCount=this._maxInstanceCount,a.maxVertexCount=this._maxVertexCount,a.maxIndexCount=this._maxIndexCount,a.geometryInitialized=this._geometryInitialized,a.matricesTexture=this._matricesTexture.toJSON(t),a.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(a.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(a.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(a.boundingBox=this.boundingBox.toJSON()));function n(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?a.background=this.background.toJSON():this.background.isTexture&&(a.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(a.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){a.geometry=n(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let h=0,c=l.length;h<c;h++){let u=l[h];n(t.shapes,u)}else n(t.shapes,l)}}if(this.isSkinnedMesh&&(a.bindMode=this.bindMode,a.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(n(t.skeletons,this.skeleton),a.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,h=this.material.length;l<h;l++)o.push(n(t.materials,this.material[l]));a.material=o}else a.material=n(t.materials,this.material);if(this.children.length>0){a.children=[];for(let o=0;o<this.children.length;o++)a.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){a.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];a.animations.push(n(t.animations,l))}}if(r){let o=s(t.geometries),l=s(t.materials),h=s(t.textures),c=s(t.images),u=s(t.shapes),d=s(t.skeletons),f=s(t.animations),x=s(t.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),h.length>0&&(i.textures=h),c.length>0&&(i.images=c),u.length>0&&(i.shapes=u),d.length>0&&(i.skeletons=d),f.length>0&&(i.animations=f),x.length>0&&(i.nodes=x)}return i.object=a,i;function s(o){let l=[];for(let h in o){let c=o[h];delete c.metadata,l.push(c)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,r=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),r===!0)for(let i=0;i<t.children.length;i++){let a=t.children[i];this.add(a.clone())}return this}};Et.DEFAULT_UP=new L(0,1,0),Et.DEFAULT_MATRIX_AUTO_UPDATE=!0,Et.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Ft=new L,ar=new L,In=new L,nr=new L,ei=new L,ti=new L,io=new L,Nn=new L,On=new L,Fn=new L,Bn=new ot,zn=new ot,Hn=new ot,Ti=class hi{constructor(t=new L,r=new L,i=new L){this.a=t,this.b=r,this.c=i}static getNormal(t,r,i,a){a.subVectors(i,r),Ft.subVectors(t,r),a.cross(Ft);let n=a.lengthSq();return n>0?a.multiplyScalar(1/Math.sqrt(n)):a.set(0,0,0)}static getBarycoord(t,r,i,a,n){Ft.subVectors(a,r),ar.subVectors(i,r),In.subVectors(t,r);let s=Ft.dot(Ft),o=Ft.dot(ar),l=Ft.dot(In),h=ar.dot(ar),c=ar.dot(In),u=s*h-o*o;if(u===0)return n.set(0,0,0),null;let d=1/u,f=(h*l-o*c)*d,x=(s*c-o*l)*d;return n.set(1-f-x,x,f)}static containsPoint(t,r,i,a){return this.getBarycoord(t,r,i,a,nr)===null?!1:nr.x>=0&&nr.y>=0&&nr.x+nr.y<=1}static getInterpolation(t,r,i,a,n,s,o,l){return this.getBarycoord(t,r,i,a,nr)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(n,nr.x),l.addScaledVector(s,nr.y),l.addScaledVector(o,nr.z),l)}static getInterpolatedAttribute(t,r,i,a,n,s){return Bn.setScalar(0),zn.setScalar(0),Hn.setScalar(0),Bn.fromBufferAttribute(t,r),zn.fromBufferAttribute(t,i),Hn.fromBufferAttribute(t,a),s.setScalar(0),s.addScaledVector(Bn,n.x),s.addScaledVector(zn,n.y),s.addScaledVector(Hn,n.z),s}static isFrontFacing(t,r,i,a){return Ft.subVectors(i,r),ar.subVectors(t,r),Ft.cross(ar).dot(a)<0}set(t,r,i){return this.a.copy(t),this.b.copy(r),this.c.copy(i),this}setFromPointsAndIndices(t,r,i,a){return this.a.copy(t[r]),this.b.copy(t[i]),this.c.copy(t[a]),this}setFromAttributeAndIndices(t,r,i,a){return this.a.fromBufferAttribute(t,r),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,a),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Ft.subVectors(this.c,this.b),ar.subVectors(this.a,this.b),Ft.cross(ar).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return hi.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,r){return hi.getBarycoord(t,this.a,this.b,this.c,r)}getInterpolation(t,r,i,a,n){return hi.getInterpolation(t,this.a,this.b,this.c,r,i,a,n)}containsPoint(t){return hi.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return hi.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,r){let i=this.a,a=this.b,n=this.c,s,o;ei.subVectors(a,i),ti.subVectors(n,i),Nn.subVectors(t,i);let l=ei.dot(Nn),h=ti.dot(Nn);if(l<=0&&h<=0)return r.copy(i);On.subVectors(t,a);let c=ei.dot(On),u=ti.dot(On);if(c>=0&&u<=c)return r.copy(a);let d=l*u-c*h;if(d<=0&&l>=0&&c<=0)return s=l/(l-c),r.copy(i).addScaledVector(ei,s);Fn.subVectors(t,n);let f=ei.dot(Fn),x=ti.dot(Fn);if(x>=0&&f<=x)return r.copy(n);let _=f*h-l*x;if(_<=0&&h>=0&&x<=0)return o=h/(h-x),r.copy(i).addScaledVector(ti,o);let m=c*x-f*u;if(m<=0&&u-c>=0&&f-x>=0)return io.subVectors(n,a),o=(u-c)/(u-c+(f-x)),r.copy(a).addScaledVector(io,o);let p=1/(m+_+d);return s=_*p,o=d*p,r.copy(i).addScaledVector(ei,s).addScaledVector(ti,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},ao={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},gr={h:0,s:0,l:0},ea={h:0,s:0,l:0};function Vn(e,t,r){return r<0&&(r+=1),r>1&&(r-=1),r<1/6?e+(t-e)*6*r:r<1/2?t:r<2/3?e+(t-e)*6*(2/3-r):e}var We=class{constructor(e,t,r){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,r)}set(e,t,r){if(t===void 0&&r===void 0){let i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,r);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=yt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Xe.colorSpaceToWorking(this,t),this}setRGB(e,t,r,i=Xe.workingColorSpace){return this.r=e,this.g=t,this.b=r,Xe.colorSpaceToWorking(this,i),this}setHSL(e,t,r,i=Xe.workingColorSpace){if(e=Mn(e,1),t=ze(t,0,1),r=ze(r,0,1),t===0)this.r=this.g=this.b=r;else{let a=r<=.5?r*(1+t):r+t-r*t,n=2*r-a;this.r=Vn(n,a,e+1/3),this.g=Vn(n,a,e),this.b=Vn(n,a,e-1/3)}return Xe.colorSpaceToWorking(this,i),this}setStyle(e,t=yt){function r(a){a!==void 0&&parseFloat(a)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let a,n=i[1],s=i[2];switch(n){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return r(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,t);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return r(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,t);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return r(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){let a=i[1],n=a.length;if(n===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,t);if(n===6)return this.setHex(parseInt(a,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=yt){let r=ao[e.toLowerCase()];return r!==void 0?this.setHex(r,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=er(e.r),this.g=er(e.g),this.b=er(e.b),this}copyLinearToSRGB(e){return this.r=jr(e.r),this.g=jr(e.g),this.b=jr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=yt){return Xe.workingToColorSpace(gt.copy(this),e),Math.round(ze(gt.r*255,0,255))*65536+Math.round(ze(gt.g*255,0,255))*256+Math.round(ze(gt.b*255,0,255))}getHexString(e=yt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Xe.workingColorSpace){Xe.workingToColorSpace(gt.copy(this),t);let r=gt.r,i=gt.g,a=gt.b,n=Math.max(r,i,a),s=Math.min(r,i,a),o,l,h=(s+n)/2;if(s===n)o=0,l=0;else{let c=n-s;switch(l=h<=.5?c/(n+s):c/(2-n-s),n){case r:o=(i-a)/c+(i<a?6:0);break;case i:o=(a-r)/c+2;break;case a:o=(r-i)/c+4;break}o/=6}return e.h=o,e.s=l,e.l=h,e}getRGB(e,t=Xe.workingColorSpace){return Xe.workingToColorSpace(gt.copy(this),t),e.r=gt.r,e.g=gt.g,e.b=gt.b,e}getStyle(e=yt){Xe.workingToColorSpace(gt.copy(this),e);let t=gt.r,r=gt.g,i=gt.b;return e!==yt?`color(${e} ${t.toFixed(3)} ${r.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(r*255)},${Math.round(i*255)})`}offsetHSL(e,t,r){return this.getHSL(gr),this.setHSL(gr.h+e,gr.s+t,gr.l+r)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,r){return this.r=e.r+(t.r-e.r)*r,this.g=e.g+(t.g-e.g)*r,this.b=e.b+(t.b-e.b)*r,this}lerpHSL(e,t){this.getHSL(gr),e.getHSL(ea);let r=xi(gr.h,ea.h,t),i=xi(gr.s,ea.s,t),a=xi(gr.l,ea.l,t);return this.setHSL(r,i,a),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,r=this.g,i=this.b,a=e.elements;return this.r=a[0]*t+a[3]*r+a[6]*i,this.g=a[1]*t+a[4]*r+a[7]*i,this.b=a[2]*t+a[5]*r+a[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},gt=new We;We.NAMES=ao;var Vh=0,bi=class extends Vr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Vh++}),this.uuid=Gr(),this.name="",this.type="Material",this.blending=Nr,this.side=or,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Aa,this.blendDst=Ra,this.blendEquation=yr,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new We(0,0,0),this.blendAlpha=0,this.depthFunc=Or,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Bs,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Hr,this.stencilZFail=Hr,this.stencilZPass=Hr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let r=e[t];if(r===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(r):i&&i.isVector3&&r&&r.isVector3?i.copy(r):this[t]=r}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let r={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.color&&this.color.isColor&&(r.color=this.color.getHex()),this.roughness!==void 0&&(r.roughness=this.roughness),this.metalness!==void 0&&(r.metalness=this.metalness),this.sheen!==void 0&&(r.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(r.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(r.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(r.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(r.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(r.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(r.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(r.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(r.shininess=this.shininess),this.clearcoat!==void 0&&(r.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(r.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(r.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(r.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(r.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,r.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(r.dispersion=this.dispersion),this.iridescence!==void 0&&(r.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(r.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(r.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(r.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(r.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(r.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(r.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(r.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(r.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(r.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(r.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(r.lightMap=this.lightMap.toJSON(e).uuid,r.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(r.aoMap=this.aoMap.toJSON(e).uuid,r.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(r.bumpMap=this.bumpMap.toJSON(e).uuid,r.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(r.normalMap=this.normalMap.toJSON(e).uuid,r.normalMapType=this.normalMapType,r.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(r.displacementMap=this.displacementMap.toJSON(e).uuid,r.displacementScale=this.displacementScale,r.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(r.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(r.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(r.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(r.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(r.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(r.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(r.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(r.combine=this.combine)),this.envMapRotation!==void 0&&(r.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(r.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(r.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(r.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(r.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(r.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(r.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(r.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(r.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(r.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(r.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(r.size=this.size),this.shadowSide!==null&&(r.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(r.sizeAttenuation=this.sizeAttenuation),this.blending!==Nr&&(r.blending=this.blending),this.side!==or&&(r.side=this.side),this.vertexColors===!0&&(r.vertexColors=!0),this.opacity<1&&(r.opacity=this.opacity),this.transparent===!0&&(r.transparent=!0),this.blendSrc!==Aa&&(r.blendSrc=this.blendSrc),this.blendDst!==Ra&&(r.blendDst=this.blendDst),this.blendEquation!==yr&&(r.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(r.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(r.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(r.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(r.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(r.blendAlpha=this.blendAlpha),this.depthFunc!==Or&&(r.depthFunc=this.depthFunc),this.depthTest===!1&&(r.depthTest=this.depthTest),this.depthWrite===!1&&(r.depthWrite=this.depthWrite),this.colorWrite===!1&&(r.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(r.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Bs&&(r.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(r.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(r.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Hr&&(r.stencilFail=this.stencilFail),this.stencilZFail!==Hr&&(r.stencilZFail=this.stencilZFail),this.stencilZPass!==Hr&&(r.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(r.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(r.rotation=this.rotation),this.polygonOffset===!0&&(r.polygonOffset=!0),this.polygonOffsetFactor!==0&&(r.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(r.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(r.linewidth=this.linewidth),this.dashSize!==void 0&&(r.dashSize=this.dashSize),this.gapSize!==void 0&&(r.gapSize=this.gapSize),this.scale!==void 0&&(r.scale=this.scale),this.dithering===!0&&(r.dithering=!0),this.alphaTest>0&&(r.alphaTest=this.alphaTest),this.alphaHash===!0&&(r.alphaHash=!0),this.alphaToCoverage===!0&&(r.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(r.premultipliedAlpha=!0),this.forceSinglePass===!0&&(r.forceSinglePass=!0),this.wireframe===!0&&(r.wireframe=!0),this.wireframeLinewidth>1&&(r.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(r.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(r.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(r.flatShading=!0),this.visible===!1&&(r.visible=!1),this.toneMapped===!1&&(r.toneMapped=!1),this.fog===!1&&(r.fog=!1),Object.keys(this.userData).length>0&&(r.userData=this.userData);function i(a){let n=[];for(let s in a){let o=a[s];delete o.metadata,n.push(o)}return n}if(t){let a=i(e.textures),n=i(e.images);a.length>0&&(r.textures=a),n.length>0&&(r.images=n)}return r}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,r=null;if(t!==null){let i=t.length;r=new Array(i);for(let a=0;a!==i;++a)r[a]=t[a].clone()}return this.clippingPlanes=r,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},wi=class extends bi{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new We(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new mr,this.combine=Es,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},lt=new L,ta=new we,Gh=0,Xt=class{constructor(e,t,r=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Gh++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=r,this.usage=Hs,this.updateRanges=[],this.gpuType=$t,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,r){e*=this.itemSize,r*=t.itemSize;for(let i=0,a=this.itemSize;i<a;i++)this.array[e+i]=t.array[r+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,r=this.count;t<r;t++)ta.fromBufferAttribute(this,t),ta.applyMatrix3(e),this.setXY(t,ta.x,ta.y);else if(this.itemSize===3)for(let t=0,r=this.count;t<r;t++)lt.fromBufferAttribute(this,t),lt.applyMatrix3(e),this.setXYZ(t,lt.x,lt.y,lt.z);return this}applyMatrix4(e){for(let t=0,r=this.count;t<r;t++)lt.fromBufferAttribute(this,t),lt.applyMatrix4(e),this.setXYZ(t,lt.x,lt.y,lt.z);return this}applyNormalMatrix(e){for(let t=0,r=this.count;t<r;t++)lt.fromBufferAttribute(this,t),lt.applyNormalMatrix(e),this.setXYZ(t,lt.x,lt.y,lt.z);return this}transformDirection(e){for(let t=0,r=this.count;t<r;t++)lt.fromBufferAttribute(this,t),lt.transformDirection(e),this.setXYZ(t,lt.x,lt.y,lt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let r=this.array[e*this.itemSize+t];return this.normalized&&(r=kr(r,this.array)),r}setComponent(e,t,r){return this.normalized&&(r=_t(r,this.array)),this.array[e*this.itemSize+t]=r,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=kr(t,this.array)),t}setX(e,t){return this.normalized&&(t=_t(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=kr(t,this.array)),t}setY(e,t){return this.normalized&&(t=_t(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=kr(t,this.array)),t}setZ(e,t){return this.normalized&&(t=_t(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=kr(t,this.array)),t}setW(e,t){return this.normalized&&(t=_t(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,r){return e*=this.itemSize,this.normalized&&(t=_t(t,this.array),r=_t(r,this.array)),this.array[e+0]=t,this.array[e+1]=r,this}setXYZ(e,t,r,i){return e*=this.itemSize,this.normalized&&(t=_t(t,this.array),r=_t(r,this.array),i=_t(i,this.array)),this.array[e+0]=t,this.array[e+1]=r,this.array[e+2]=i,this}setXYZW(e,t,r,i,a){return e*=this.itemSize,this.normalized&&(t=_t(t,this.array),r=_t(r,this.array),i=_t(i,this.array),a=_t(a,this.array)),this.array[e+0]=t,this.array[e+1]=r,this.array[e+2]=i,this.array[e+3]=a,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Hs&&(e.usage=this.usage),e}},no=class extends Xt{constructor(e,t,r){super(new Uint16Array(e),t,r)}},so=class extends Xt{constructor(e,t,r){super(new Uint32Array(e),t,r)}},Qe=class extends Xt{constructor(e,t,r){super(new Float32Array(e),t,r)}},kh=0,Rt=new ht,Gn=new Et,ri=new L,Tt=new yi,Ai=new yi,dt=new L,Bt=class ll extends Vr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:kh++}),this.uuid=Gr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Ws(t)?so:no)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,r){return this.attributes[t]=r,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,r,i=0){this.groups.push({start:t,count:r,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,r){this.drawRange.start=t,this.drawRange.count=r}applyMatrix4(t){let r=this.attributes.position;r!==void 0&&(r.applyMatrix4(t),r.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let n=new He().getNormalMatrix(t);i.applyNormalMatrix(n),i.needsUpdate=!0}let a=this.attributes.tangent;return a!==void 0&&(a.transformDirection(t),a.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return Rt.makeRotationFromQuaternion(t),this.applyMatrix4(Rt),this}rotateX(t){return Rt.makeRotationX(t),this.applyMatrix4(Rt),this}rotateY(t){return Rt.makeRotationY(t),this.applyMatrix4(Rt),this}rotateZ(t){return Rt.makeRotationZ(t),this.applyMatrix4(Rt),this}translate(t,r,i){return Rt.makeTranslation(t,r,i),this.applyMatrix4(Rt),this}scale(t,r,i){return Rt.makeScale(t,r,i),this.applyMatrix4(Rt),this}lookAt(t){return Gn.lookAt(t),Gn.updateMatrix(),this.applyMatrix4(Gn.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ri).negate(),this.translate(ri.x,ri.y,ri.z),this}setFromPoints(t){let r=this.getAttribute("position");if(r===void 0){let i=[];for(let a=0,n=t.length;a<n;a++){let s=t[a];i.push(s.x,s.y,s.z||0)}this.setAttribute("position",new Qe(i,3))}else{let i=Math.min(t.length,r.count);for(let a=0;a<i;a++){let n=t[a];r.setXYZ(a,n.x,n.y,n.z||0)}t.length>r.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),r.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new yi);let t=this.attributes.position,r=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new L(-1/0,-1/0,-1/0),new L(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),r)for(let i=0,a=r.length;i<a;i++){let n=r[i];Tt.setFromBufferAttribute(n),this.morphTargetsRelative?(dt.addVectors(this.boundingBox.min,Tt.min),this.boundingBox.expandByPoint(dt),dt.addVectors(this.boundingBox.max,Tt.max),this.boundingBox.expandByPoint(dt)):(this.boundingBox.expandByPoint(Tt.min),this.boundingBox.expandByPoint(Tt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Cn);let t=this.attributes.position,r=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new L,1/0);return}if(t){let i=this.boundingSphere.center;if(Tt.setFromBufferAttribute(t),r)for(let n=0,s=r.length;n<s;n++){let o=r[n];Ai.setFromBufferAttribute(o),this.morphTargetsRelative?(dt.addVectors(Tt.min,Ai.min),Tt.expandByPoint(dt),dt.addVectors(Tt.max,Ai.max),Tt.expandByPoint(dt)):(Tt.expandByPoint(Ai.min),Tt.expandByPoint(Ai.max))}Tt.getCenter(i);let a=0;for(let n=0,s=t.count;n<s;n++)dt.fromBufferAttribute(t,n),a=Math.max(a,i.distanceToSquared(dt));if(r)for(let n=0,s=r.length;n<s;n++){let o=r[n],l=this.morphTargetsRelative;for(let h=0,c=o.count;h<c;h++)dt.fromBufferAttribute(o,h),l&&(ri.fromBufferAttribute(t,h),dt.add(ri)),a=Math.max(a,i.distanceToSquared(dt))}this.boundingSphere.radius=Math.sqrt(a),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,r=this.attributes;if(t===null||r.position===void 0||r.normal===void 0||r.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=r.position,a=r.normal,n=r.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Xt(new Float32Array(4*i.count),4));let s=this.getAttribute("tangent"),o=[],l=[];for(let O=0;O<i.count;O++)o[O]=new L,l[O]=new L;let h=new L,c=new L,u=new L,d=new we,f=new we,x=new we,_=new L,m=new L;function p(O,E,y){h.fromBufferAttribute(i,O),c.fromBufferAttribute(i,E),u.fromBufferAttribute(i,y),d.fromBufferAttribute(n,O),f.fromBufferAttribute(n,E),x.fromBufferAttribute(n,y),c.sub(h),u.sub(h),f.sub(d),x.sub(d);let U=1/(f.x*x.y-x.x*f.y);isFinite(U)&&(_.copy(c).multiplyScalar(x.y).addScaledVector(u,-f.y).multiplyScalar(U),m.copy(u).multiplyScalar(f.x).addScaledVector(c,-x.x).multiplyScalar(U),o[O].add(_),o[E].add(_),o[y].add(_),l[O].add(m),l[E].add(m),l[y].add(m))}let b=this.groups;b.length===0&&(b=[{start:0,count:t.count}]);for(let O=0,E=b.length;O<E;++O){let y=b[O],U=y.start,V=y.count;for(let B=U,X=U+V;B<X;B+=3)p(t.getX(B+0),t.getX(B+1),t.getX(B+2))}let M=new L,T=new L,D=new L,w=new L;function A(O){D.fromBufferAttribute(a,O),w.copy(D);let E=o[O];M.copy(E),M.sub(D.multiplyScalar(D.dot(E))).normalize(),T.crossVectors(w,E);let y=T.dot(l[O])<0?-1:1;s.setXYZW(O,M.x,M.y,M.z,y)}for(let O=0,E=b.length;O<E;++O){let y=b[O],U=y.start,V=y.count;for(let B=U,X=U+V;B<X;B+=3)A(t.getX(B+0)),A(t.getX(B+1)),A(t.getX(B+2))}}computeVertexNormals(){let t=this.index,r=this.getAttribute("position");if(r!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Xt(new Float32Array(r.count*3),3),this.setAttribute("normal",i);else for(let d=0,f=i.count;d<f;d++)i.setXYZ(d,0,0,0);let a=new L,n=new L,s=new L,o=new L,l=new L,h=new L,c=new L,u=new L;if(t)for(let d=0,f=t.count;d<f;d+=3){let x=t.getX(d+0),_=t.getX(d+1),m=t.getX(d+2);a.fromBufferAttribute(r,x),n.fromBufferAttribute(r,_),s.fromBufferAttribute(r,m),c.subVectors(s,n),u.subVectors(a,n),c.cross(u),o.fromBufferAttribute(i,x),l.fromBufferAttribute(i,_),h.fromBufferAttribute(i,m),o.add(c),l.add(c),h.add(c),i.setXYZ(x,o.x,o.y,o.z),i.setXYZ(_,l.x,l.y,l.z),i.setXYZ(m,h.x,h.y,h.z)}else for(let d=0,f=r.count;d<f;d+=3)a.fromBufferAttribute(r,d+0),n.fromBufferAttribute(r,d+1),s.fromBufferAttribute(r,d+2),c.subVectors(s,n),u.subVectors(a,n),c.cross(u),i.setXYZ(d+0,c.x,c.y,c.z),i.setXYZ(d+1,c.x,c.y,c.z),i.setXYZ(d+2,c.x,c.y,c.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let r=0,i=t.count;r<i;r++)dt.fromBufferAttribute(t,r),dt.normalize(),t.setXYZ(r,dt.x,dt.y,dt.z)}toNonIndexed(){function t(o,l){let h=o.array,c=o.itemSize,u=o.normalized,d=new h.constructor(l.length*c),f=0,x=0;for(let _=0,m=l.length;_<m;_++){o.isInterleavedBufferAttribute?f=l[_]*o.data.stride+o.offset:f=l[_]*c;for(let p=0;p<c;p++)d[x++]=h[f++]}return new Xt(d,c,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let r=new ll,i=this.index.array,a=this.attributes;for(let o in a){let l=a[o],h=t(l,i);r.setAttribute(o,h)}let n=this.morphAttributes;for(let o in n){let l=[],h=n[o];for(let c=0,u=h.length;c<u;c++){let d=h[c],f=t(d,i);l.push(f)}r.morphAttributes[o]=l}r.morphTargetsRelative=this.morphTargetsRelative;let s=this.groups;for(let o=0,l=s.length;o<l;o++){let h=s[o];r.addGroup(h.start,h.count,h.materialIndex)}return r}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let h in l)l[h]!==void 0&&(t[h]=l[h]);return t}t.data={attributes:{}};let r=this.index;r!==null&&(t.data.index={type:r.array.constructor.name,array:Array.prototype.slice.call(r.array)});let i=this.attributes;for(let l in i){let h=i[l];t.data.attributes[l]=h.toJSON(t.data)}let a={},n=!1;for(let l in this.morphAttributes){let h=this.morphAttributes[l],c=[];for(let u=0,d=h.length;u<d;u++){let f=h[u];c.push(f.toJSON(t.data))}c.length>0&&(a[l]=c,n=!0)}n&&(t.data.morphAttributes=a,t.data.morphTargetsRelative=this.morphTargetsRelative);let s=this.groups;s.length>0&&(t.data.groups=JSON.parse(JSON.stringify(s)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let r={};this.name=t.name;let i=t.index;i!==null&&this.setIndex(i.clone());let a=t.attributes;for(let h in a){let c=a[h];this.setAttribute(h,c.clone(r))}let n=t.morphAttributes;for(let h in n){let c=[],u=n[h];for(let d=0,f=u.length;d<f;d++)c.push(u[d].clone(r));this.morphAttributes[h]=c}this.morphTargetsRelative=t.morphTargetsRelative;let s=t.groups;for(let h=0,c=s.length;h<c;h++){let u=s[h];this.addGroup(u.start,u.count,u.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},oo=new ht,Ar=new Ih,ra=new Cn,lo=new L,ia=new L,aa=new L,na=new L,kn=new L,sa=new L,ho=new L,oa=new L,bt=class extends Et{constructor(e=new Bt,t=new wi){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let r=e[t[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,a=r.length;i<a;i++){let n=r[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[n]=i}}}}getVertexPosition(e,t){let r=this.geometry,i=r.attributes.position,a=r.morphAttributes.position,n=r.morphTargetsRelative;t.fromBufferAttribute(i,e);let s=this.morphTargetInfluences;if(a&&s){sa.set(0,0,0);for(let o=0,l=a.length;o<l;o++){let h=s[o],c=a[o];h!==0&&(kn.fromBufferAttribute(c,e),n?sa.addScaledVector(kn,h):sa.addScaledVector(kn.sub(t),h))}t.add(sa)}return t}raycast(e,t){let r=this.geometry,i=this.material,a=this.matrixWorld;i!==void 0&&(r.boundingSphere===null&&r.computeBoundingSphere(),ra.copy(r.boundingSphere),ra.applyMatrix4(a),Ar.copy(e.ray).recast(e.near),!(ra.containsPoint(Ar.origin)===!1&&(Ar.intersectSphere(ra,lo)===null||Ar.origin.distanceToSquared(lo)>(e.far-e.near)**2))&&(oo.copy(a).invert(),Ar.copy(e.ray).applyMatrix4(oo),!(r.boundingBox!==null&&Ar.intersectsBox(r.boundingBox)===!1)&&this._computeIntersections(e,t,Ar)))}_computeIntersections(e,t,r){let i,a=this.geometry,n=this.material,s=a.index,o=a.attributes.position,l=a.attributes.uv,h=a.attributes.uv1,c=a.attributes.normal,u=a.groups,d=a.drawRange;if(s!==null)if(Array.isArray(n))for(let f=0,x=u.length;f<x;f++){let _=u[f],m=n[_.materialIndex],p=Math.max(_.start,d.start),b=Math.min(s.count,Math.min(_.start+_.count,d.start+d.count));for(let M=p,T=b;M<T;M+=3){let D=s.getX(M),w=s.getX(M+1),A=s.getX(M+2);i=la(this,m,e,r,l,h,c,D,w,A),i&&(i.faceIndex=Math.floor(M/3),i.face.materialIndex=_.materialIndex,t.push(i))}}else{let f=Math.max(0,d.start),x=Math.min(s.count,d.start+d.count);for(let _=f,m=x;_<m;_+=3){let p=s.getX(_),b=s.getX(_+1),M=s.getX(_+2);i=la(this,n,e,r,l,h,c,p,b,M),i&&(i.faceIndex=Math.floor(_/3),t.push(i))}}else if(o!==void 0)if(Array.isArray(n))for(let f=0,x=u.length;f<x;f++){let _=u[f],m=n[_.materialIndex],p=Math.max(_.start,d.start),b=Math.min(o.count,Math.min(_.start+_.count,d.start+d.count));for(let M=p,T=b;M<T;M+=3){let D=M,w=M+1,A=M+2;i=la(this,m,e,r,l,h,c,D,w,A),i&&(i.faceIndex=Math.floor(M/3),i.face.materialIndex=_.materialIndex,t.push(i))}}else{let f=Math.max(0,d.start),x=Math.min(o.count,d.start+d.count);for(let _=f,m=x;_<m;_+=3){let p=_,b=_+1,M=_+2;i=la(this,n,e,r,l,h,c,p,b,M),i&&(i.faceIndex=Math.floor(_/3),t.push(i))}}}};function Wh(e,t,r,i,a,n,s,o){let l;if(t.side===xt?l=i.intersectTriangle(s,n,a,!0,o):l=i.intersectTriangle(a,n,s,t.side===or,o),l===null)return null;oa.copy(o),oa.applyMatrix4(e.matrixWorld);let h=r.ray.origin.distanceTo(oa);return h<r.near||h>r.far?null:{distance:h,point:oa.clone(),object:e}}function la(e,t,r,i,a,n,s,o,l,h){e.getVertexPosition(o,ia),e.getVertexPosition(l,aa),e.getVertexPosition(h,na);let c=Wh(e,t,r,i,ia,aa,na,ho);if(c){let u=new L;Ti.getBarycoord(ho,ia,aa,na,u),a&&(c.uv=Ti.getInterpolatedAttribute(a,o,l,h,u,new we)),n&&(c.uv1=Ti.getInterpolatedAttribute(n,o,l,h,u,new we)),s&&(c.normal=Ti.getInterpolatedAttribute(s,o,l,h,u,new L),c.normal.dot(i.direction)>0&&c.normal.multiplyScalar(-1));let d={a:o,b:l,c:h,normal:new L,materialIndex:0};Ti.getNormal(ia,aa,na,d.normal),c.face=d,c.barycoord=u}return c}var Wn=class hl extends Bt{constructor(t=1,r=1,i=1,a=1,n=1,s=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:r,depth:i,widthSegments:a,heightSegments:n,depthSegments:s};let o=this;a=Math.floor(a),n=Math.floor(n),s=Math.floor(s);let l=[],h=[],c=[],u=[],d=0,f=0;x("z","y","x",-1,-1,i,r,t,s,n,0),x("z","y","x",1,-1,i,r,-t,s,n,1),x("x","z","y",1,1,t,i,r,a,s,2),x("x","z","y",1,-1,t,i,-r,a,s,3),x("x","y","z",1,-1,t,r,i,a,n,4),x("x","y","z",-1,-1,t,r,-i,a,n,5),this.setIndex(l),this.setAttribute("position",new Qe(h,3)),this.setAttribute("normal",new Qe(c,3)),this.setAttribute("uv",new Qe(u,2));function x(_,m,p,b,M,T,D,w,A,O,E){let y=T/A,U=D/O,V=T/2,B=D/2,X=w/2,Y=A+1,k=O+1,$=0,q=0,K=new L;for(let me=0;me<k;me++){let De=me*U-B;for(let Pe=0;Pe<Y;Pe++){let Fe=Pe*y-V;K[_]=Fe*b,K[m]=De*M,K[p]=X,h.push(K.x,K.y,K.z),K[_]=0,K[m]=0,K[p]=w>0?1:-1,c.push(K.x,K.y,K.z),u.push(Pe/A),u.push(1-me/O),$+=1}}for(let me=0;me<O;me++)for(let De=0;De<A;De++){let Pe=d+De+Y*me,Fe=d+De+Y*(me+1),j=d+(De+1)+Y*(me+1),re=d+(De+1)+Y*me;l.push(Pe,Fe,re),l.push(Fe,j,re),q+=6}o.addGroup(f,q,E),f+=q,d+=$}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new hl(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};function ii(e){let t={};for(let r in e){t[r]={};for(let i in e[r]){let a=e[r][i];a&&(a.isColor||a.isMatrix3||a.isMatrix4||a.isVector2||a.isVector3||a.isVector4||a.isTexture||a.isQuaternion)?a.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[r][i]=null):t[r][i]=a.clone():Array.isArray(a)?t[r][i]=a.slice():t[r][i]=a}}return t}function vt(e){let t={};for(let r=0;r<e.length;r++){let i=ii(e[r]);for(let a in i)t[a]=i[a]}return t}function Xh(e){let t=[];for(let r=0;r<e.length;r++)t.push(e[r].clone());return t}function co(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Xe.workingColorSpace}var jh={clone:ii,merge:vt},qh=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Yh=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,sr=class extends bi{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=qh,this.fragmentShader=Yh,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=ii(e.uniforms),this.uniformsGroups=Xh(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let i in this.uniforms){let a=this.uniforms[i].value;a&&a.isTexture?t.uniforms[i]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[i]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[i]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[i]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[i]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[i]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[i]={type:"m4",value:a.toArray()}:t.uniforms[i]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let r={};for(let i in this.extensions)this.extensions[i]===!0&&(r[i]=!0);return Object.keys(r).length>0&&(t.extensions=r),t}},uo=class extends Et{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ht,this.projectionMatrix=new ht,this.projectionMatrixInverse=new ht,this.coordinateSystem=Wt,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},_r=new L,po=new we,fo=new we,Ct=class extends uo{constructor(e=50,t=1,r=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=r,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=vi*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(_i*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return vi*2*Math.atan(Math.tan(_i*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,r){_r.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(_r.x,_r.y).multiplyScalar(-e/_r.z),_r.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),r.set(_r.x,_r.y).multiplyScalar(-e/_r.z)}getViewSize(e,t){return this.getViewBounds(e,po,fo),t.subVectors(fo,po)}setViewOffset(e,t,r,i,a,n){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=r,this.view.offsetY=i,this.view.width=a,this.view.height=n,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(_i*.5*this.fov)/this.zoom,r=2*t,i=this.aspect*r,a=-.5*i,n=this.view;if(this.view!==null&&this.view.enabled){let o=n.fullWidth,l=n.fullHeight;a+=n.offsetX*i/o,t-=n.offsetY*r/l,i*=n.width/o,r*=n.height/l}let s=this.filmOffset;s!==0&&(a+=e*s/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+i,t,t-r,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},ai=-90,ni=1,Zh=class extends Et{constructor(e,t,r){super(),this.type="CubeCamera",this.renderTarget=r,this.coordinateSystem=null,this.activeMipmapLevel=0;let i=new Ct(ai,ni,e,t);i.layers=this.layers,this.add(i);let a=new Ct(ai,ni,e,t);a.layers=this.layers,this.add(a);let n=new Ct(ai,ni,e,t);n.layers=this.layers,this.add(n);let s=new Ct(ai,ni,e,t);s.layers=this.layers,this.add(s);let o=new Ct(ai,ni,e,t);o.layers=this.layers,this.add(o);let l=new Ct(ai,ni,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[r,i,a,n,s,o]=t;for(let l of t)this.remove(l);if(e===Wt)r.up.set(0,1,0),r.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),n.up.set(0,0,1),n.lookAt(0,-1,0),s.up.set(0,1,0),s.lookAt(0,0,1),o.up.set(0,1,0),o.lookAt(0,0,-1);else if(e===Xi)r.up.set(0,-1,0),r.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),n.up.set(0,0,-1),n.lookAt(0,-1,0),s.up.set(0,-1,0),s.lookAt(0,0,1),o.up.set(0,-1,0),o.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:r,activeMipmapLevel:i}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[a,n,s,o,l,h]=this.children,c=e.getRenderTarget(),u=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),f=e.xr.enabled;e.xr.enabled=!1;let x=r.texture.generateMipmaps;r.texture.generateMipmaps=!1,e.setRenderTarget(r,0,i),e.render(t,a),e.setRenderTarget(r,1,i),e.render(t,n),e.setRenderTarget(r,2,i),e.render(t,s),e.setRenderTarget(r,3,i),e.render(t,o),e.setRenderTarget(r,4,i),e.render(t,l),r.texture.generateMipmaps=x,e.setRenderTarget(r,5,i),e.render(t,h),e.setRenderTarget(c,u,d),e.xr.enabled=f,r.texture.needsPMREMUpdate=!0}},mo=class extends It{constructor(e=[],t=Fr,r,i,a,n,s,o,l,h){super(e,t,r,i,a,n,s,o,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Kh=class extends Tr{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let r={width:e,height:e,depth:1},i=[r,r,r,r,r,r];this.texture=new mo(i),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let r={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new Wn(5,5,5),a=new sr({name:"CubemapFromEquirect",uniforms:ii(r.uniforms),vertexShader:r.vertexShader,fragmentShader:r.fragmentShader,side:xt,blending:lr});a.uniforms.tEquirect.value=t;let n=new bt(i,a),s=t.minFilter;return t.minFilter===Sr&&(t.minFilter=Gt),new Zh(1,10,this).update(e,n),t.minFilter=s,n.geometry.dispose(),n.material.dispose(),this}clear(e,t=!0,r=!0,i=!0){let a=e.getRenderTarget();for(let n=0;n<6;n++)e.setRenderTarget(this,n),e.clear(t,r,i);e.setRenderTarget(a)}},jt=class extends Et{constructor(){super(),this.isGroup=!0,this.type="Group"}},Jh={type:"move"},Xn=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new jt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new jt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new L,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new L),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new jt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new L,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new L),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let r of e.hand.values())this._getHandJoint(t,r)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,r){let i=null,a=null,n=null,s=this._targetRay,o=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){n=!0;for(let x of e.hand.values()){let _=t.getJointPose(x,r),m=this._getHandJoint(l,x);_!==null&&(m.matrix.fromArray(_.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=_.radius),m.visible=_!==null}let h=l.joints["index-finger-tip"],c=l.joints["thumb-tip"],u=h.position.distanceTo(c.position),d=.02,f=.005;l.inputState.pinching&&u>d+f?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&u<=d-f&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else o!==null&&e.gripSpace&&(a=t.getPose(e.gripSpace,r),a!==null&&(o.matrix.fromArray(a.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,a.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(a.linearVelocity)):o.hasLinearVelocity=!1,a.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(a.angularVelocity)):o.hasAngularVelocity=!1));s!==null&&(i=t.getPose(e.targetRaySpace,r),i===null&&a!==null&&(i=a),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,this.dispatchEvent(Jh)))}return s!==null&&(s.visible=i!==null),o!==null&&(o.visible=a!==null),l!==null&&(l.visible=n!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let r=new jt;r.matrixAutoUpdate=!1,r.visible=!1,e.joints[t.jointName]=r,e.add(r)}return e.joints[t.jointName]}},$h=class extends Et{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new mr,this.environmentIntensity=1,this.environmentRotation=new mr,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},jn=new L,Qh=new L,ec=new He,Rr=class{constructor(e=new L(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,r,i){return this.normal.set(e,t,r),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,r){let i=jn.subVectors(r,t).cross(Qh.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let r=e.delta(jn),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return a<0||a>1?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),r=this.distanceToPoint(e.end);return t<0&&r>0||r<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let r=t||ec.getNormalMatrix(e),i=this.coplanarPoint(jn).applyMatrix4(e),a=this.normal.applyMatrix3(r).normalize();return this.constant=-i.dot(a),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Cr=new Cn,tc=new we(.5,.5),ha=new L,qn=class{constructor(e=new Rr,t=new Rr,r=new Rr,i=new Rr,a=new Rr,n=new Rr){this.planes=[e,t,r,i,a,n]}set(e,t,r,i,a,n){let s=this.planes;return s[0].copy(e),s[1].copy(t),s[2].copy(r),s[3].copy(i),s[4].copy(a),s[5].copy(n),this}copy(e){let t=this.planes;for(let r=0;r<6;r++)t[r].copy(e.planes[r]);return this}setFromProjectionMatrix(e,t=Wt,r=!1){let i=this.planes,a=e.elements,n=a[0],s=a[1],o=a[2],l=a[3],h=a[4],c=a[5],u=a[6],d=a[7],f=a[8],x=a[9],_=a[10],m=a[11],p=a[12],b=a[13],M=a[14],T=a[15];if(i[0].setComponents(l-n,d-h,m-f,T-p).normalize(),i[1].setComponents(l+n,d+h,m+f,T+p).normalize(),i[2].setComponents(l+s,d+c,m+x,T+b).normalize(),i[3].setComponents(l-s,d-c,m-x,T-b).normalize(),r)i[4].setComponents(o,u,_,M).normalize(),i[5].setComponents(l-o,d-u,m-_,T-M).normalize();else if(i[4].setComponents(l-o,d-u,m-_,T-M).normalize(),t===Wt)i[5].setComponents(l+o,d+u,m+_,T+M).normalize();else if(t===Xi)i[5].setComponents(o,u,_,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Cr.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Cr.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Cr)}intersectsSprite(e){Cr.center.set(0,0,0);let t=tc.distanceTo(e.center);return Cr.radius=.7071067811865476+t,Cr.applyMatrix4(e.matrixWorld),this.intersectsSphere(Cr)}intersectsSphere(e){let t=this.planes,r=e.center,i=-e.radius;for(let a=0;a<6;a++)if(t[a].distanceToPoint(r)<i)return!1;return!0}intersectsBox(e){let t=this.planes;for(let r=0;r<6;r++){let i=t[r];if(ha.x=i.normal.x>0?e.max.x:e.min.x,ha.y=i.normal.y>0?e.max.y:e.min.y,ha.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(ha)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let r=0;r<6;r++)if(t[r].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},go=class extends It{constructor(e,t,r,i,a,n,s,o,l){super(e,t,r,i,a,n,s,o,l),this.isCanvasTexture=!0,this.needsUpdate=!0}},_o=class extends It{constructor(e,t,r=Er,i,a,n,s=Lt,o=Lt,l,h=mi,c=1){if(h!==mi&&h!==gi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:e,height:t,depth:c};super(u,i,a,n,s,o,h,r,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Tn(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},ca=class cl extends Bt{constructor(t=1,r=1,i=1,a=32,n=1,s=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:r,height:i,radialSegments:a,heightSegments:n,openEnded:s,thetaStart:o,thetaLength:l};let h=this;a=Math.floor(a),n=Math.floor(n);let c=[],u=[],d=[],f=[],x=0,_=[],m=i/2,p=0;b(),s===!1&&(t>0&&M(!0),r>0&&M(!1)),this.setIndex(c),this.setAttribute("position",new Qe(u,3)),this.setAttribute("normal",new Qe(d,3)),this.setAttribute("uv",new Qe(f,2));function b(){let T=new L,D=new L,w=0,A=(r-t)/i;for(let O=0;O<=n;O++){let E=[],y=O/n,U=y*(r-t)+t;for(let V=0;V<=a;V++){let B=V/a,X=B*l+o,Y=Math.sin(X),k=Math.cos(X);D.x=U*Y,D.y=-y*i+m,D.z=U*k,u.push(D.x,D.y,D.z),T.set(Y,A,k).normalize(),d.push(T.x,T.y,T.z),f.push(B,1-y),E.push(x++)}_.push(E)}for(let O=0;O<a;O++)for(let E=0;E<n;E++){let y=_[E][O],U=_[E+1][O],V=_[E+1][O+1],B=_[E][O+1];(t>0||E!==0)&&(c.push(y,U,B),w+=3),(r>0||E!==n-1)&&(c.push(U,V,B),w+=3)}h.addGroup(p,w,0),p+=w}function M(T){let D=x,w=new we,A=new L,O=0,E=T===!0?t:r,y=T===!0?1:-1;for(let V=1;V<=a;V++)u.push(0,m*y,0),d.push(0,y,0),f.push(.5,.5),x++;let U=x;for(let V=0;V<=a;V++){let B=V/a*l+o,X=Math.cos(B),Y=Math.sin(B);A.x=E*Y,A.y=m*y,A.z=E*X,u.push(A.x,A.y,A.z),d.push(0,y,0),w.x=X*.5+.5,w.y=Y*.5*y+.5,f.push(w.x,w.y),x++}for(let V=0;V<a;V++){let B=D+V,X=U+V;T===!0?c.push(X,X+1,B):c.push(X+1,X,B),O+=3}h.addGroup(p,O,T===!0?1:2),p+=O}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new cl(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},zt=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){console.warn("THREE.Curve: .getPoint() not implemented.")}getPointAt(e,t){let r=this.getUtoTmapping(e);return this.getPoint(r,t)}getPoints(e=5){let t=[];for(let r=0;r<=e;r++)t.push(this.getPoint(r/e));return t}getSpacedPoints(e=5){let t=[];for(let r=0;r<=e;r++)t.push(this.getPointAt(r/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],r,i=this.getPoint(0),a=0;t.push(0);for(let n=1;n<=e;n++)r=this.getPoint(n/e),a+=r.distanceTo(i),t.push(a),i=r;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let r=this.getLengths(),i=0,a=r.length,n;t?n=t:n=e*r[a-1];let s=0,o=a-1,l;for(;s<=o;)if(i=Math.floor(s+(o-s)/2),l=r[i]-n,l<0)s=i+1;else if(l>0)o=i-1;else{o=i;break}if(i=o,r[i]===n)return i/(a-1);let h=r[i],c=r[i+1]-h,u=(n-h)/c;return(i+u)/(a-1)}getTangent(e,t){let r=e-1e-4,i=e+1e-4;r<0&&(r=0),i>1&&(i=1);let a=this.getPoint(r),n=this.getPoint(i),s=t||(a.isVector2?new we:new L);return s.copy(n).sub(a).normalize(),s}getTangentAt(e,t){let r=this.getUtoTmapping(e);return this.getTangent(r,t)}computeFrenetFrames(e,t=!1){let r=new L,i=[],a=[],n=[],s=new L,o=new ht;for(let d=0;d<=e;d++){let f=d/e;i[d]=this.getTangentAt(f,new L)}a[0]=new L,n[0]=new L;let l=Number.MAX_VALUE,h=Math.abs(i[0].x),c=Math.abs(i[0].y),u=Math.abs(i[0].z);h<=l&&(l=h,r.set(1,0,0)),c<=l&&(l=c,r.set(0,1,0)),u<=l&&r.set(0,0,1),s.crossVectors(i[0],r).normalize(),a[0].crossVectors(i[0],s),n[0].crossVectors(i[0],a[0]);for(let d=1;d<=e;d++){if(a[d]=a[d-1].clone(),n[d]=n[d-1].clone(),s.crossVectors(i[d-1],i[d]),s.length()>Number.EPSILON){s.normalize();let f=Math.acos(ze(i[d-1].dot(i[d]),-1,1));a[d].applyMatrix4(o.makeRotationAxis(s,f))}n[d].crossVectors(i[d],a[d])}if(t===!0){let d=Math.acos(ze(a[0].dot(a[e]),-1,1));d/=e,i[0].dot(s.crossVectors(a[0],a[e]))>0&&(d=-d);for(let f=1;f<=e;f++)a[f].applyMatrix4(o.makeRotationAxis(i[f],d*f)),n[f].crossVectors(i[f],a[f])}return{tangents:i,normals:a,binormals:n}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},vo=class extends zt{constructor(e=0,t=0,r=1,i=1,a=0,n=Math.PI*2,s=!1,o=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=r,this.yRadius=i,this.aStartAngle=a,this.aEndAngle=n,this.aClockwise=s,this.aRotation=o}getPoint(e,t=new we){let r=t,i=Math.PI*2,a=this.aEndAngle-this.aStartAngle,n=Math.abs(a)<Number.EPSILON;for(;a<0;)a+=i;for(;a>i;)a-=i;a<Number.EPSILON&&(n?a=0:a=i),this.aClockwise===!0&&!n&&(a===i?a=-i:a=a-i);let s=this.aStartAngle+e*a,o=this.aX+this.xRadius*Math.cos(s),l=this.aY+this.yRadius*Math.sin(s);if(this.aRotation!==0){let h=Math.cos(this.aRotation),c=Math.sin(this.aRotation),u=o-this.aX,d=l-this.aY;o=u*h-d*c+this.aX,l=u*c+d*h+this.aY}return r.set(o,l)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},rc=class extends vo{constructor(e,t,r,i,a,n){super(e,t,r,r,i,a,n),this.isArcCurve=!0,this.type="ArcCurve"}};function Yn(){let e=0,t=0,r=0,i=0;function a(n,s,o,l){e=n,t=o,r=-3*n+3*s-2*o-l,i=2*n-2*s+o+l}return{initCatmullRom:function(n,s,o,l,h){a(s,o,h*(o-n),h*(l-s))},initNonuniformCatmullRom:function(n,s,o,l,h,c,u){let d=(s-n)/h-(o-n)/(h+c)+(o-s)/c,f=(o-s)/c-(l-s)/(c+u)+(l-o)/u;d*=c,f*=c,a(s,o,d,f)},calc:function(n){let s=n*n,o=s*n;return e+t*n+r*s+i*o}}}var ua=new L,Zn=new Yn,Kn=new Yn,Jn=new Yn,ic=class extends zt{constructor(e=[],t=!1,r="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=r,this.tension=i}getPoint(e,t=new L){let r=t,i=this.points,a=i.length,n=(a-(this.closed?0:1))*e,s=Math.floor(n),o=n-s;this.closed?s+=s>0?0:(Math.floor(Math.abs(s)/a)+1)*a:o===0&&s===a-1&&(s=a-2,o=1);let l,h;this.closed||s>0?l=i[(s-1)%a]:(ua.subVectors(i[0],i[1]).add(i[0]),l=ua);let c=i[s%a],u=i[(s+1)%a];if(this.closed||s+2<a?h=i[(s+2)%a]:(ua.subVectors(i[a-1],i[a-2]).add(i[a-1]),h=ua),this.curveType==="centripetal"||this.curveType==="chordal"){let d=this.curveType==="chordal"?.5:.25,f=Math.pow(l.distanceToSquared(c),d),x=Math.pow(c.distanceToSquared(u),d),_=Math.pow(u.distanceToSquared(h),d);x<1e-4&&(x=1),f<1e-4&&(f=x),_<1e-4&&(_=x),Zn.initNonuniformCatmullRom(l.x,c.x,u.x,h.x,f,x,_),Kn.initNonuniformCatmullRom(l.y,c.y,u.y,h.y,f,x,_),Jn.initNonuniformCatmullRom(l.z,c.z,u.z,h.z,f,x,_)}else this.curveType==="catmullrom"&&(Zn.initCatmullRom(l.x,c.x,u.x,h.x,this.tension),Kn.initCatmullRom(l.y,c.y,u.y,h.y,this.tension),Jn.initCatmullRom(l.z,c.z,u.z,h.z,this.tension));return r.set(Zn.calc(o),Kn.calc(o),Jn.calc(o)),r}copy(e){super.copy(e),this.points=[];for(let t=0,r=e.points.length;t<r;t++){let i=e.points[t];this.points.push(i.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,r=this.points.length;t<r;t++){let i=this.points[t];e.points.push(i.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,r=e.points.length;t<r;t++){let i=e.points[t];this.points.push(new L().fromArray(i))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function xo(e,t,r,i,a){let n=(i-t)*.5,s=(a-r)*.5,o=e*e,l=e*o;return(2*r-2*i+n+s)*l+(-3*r+3*i-2*n-s)*o+n*e+r}function ac(e,t){let r=1-e;return r*r*t}function nc(e,t){return 2*(1-e)*e*t}function sc(e,t){return e*e*t}function Ri(e,t,r,i){return ac(e,t)+nc(e,r)+sc(e,i)}function oc(e,t){let r=1-e;return r*r*r*t}function lc(e,t){let r=1-e;return 3*r*r*e*t}function hc(e,t){return 3*(1-e)*e*e*t}function cc(e,t){return e*e*e*t}function Ci(e,t,r,i,a){return oc(e,t)+lc(e,r)+hc(e,i)+cc(e,a)}var uc=class extends zt{constructor(e=new we,t=new we,r=new we,i=new we){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=r,this.v3=i}getPoint(e,t=new we){let r=t,i=this.v0,a=this.v1,n=this.v2,s=this.v3;return r.set(Ci(e,i.x,a.x,n.x,s.x),Ci(e,i.y,a.y,n.y,s.y)),r}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},dc=class extends zt{constructor(e=new L,t=new L,r=new L,i=new L){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=r,this.v3=i}getPoint(e,t=new L){let r=t,i=this.v0,a=this.v1,n=this.v2,s=this.v3;return r.set(Ci(e,i.x,a.x,n.x,s.x),Ci(e,i.y,a.y,n.y,s.y),Ci(e,i.z,a.z,n.z,s.z)),r}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},pc=class extends zt{constructor(e=new we,t=new we){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new we){let r=t;return e===1?r.copy(this.v2):(r.copy(this.v2).sub(this.v1),r.multiplyScalar(e).add(this.v1)),r}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new we){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},da=class extends zt{constructor(e=new L,t=new L){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new L){let r=t;return e===1?r.copy(this.v2):(r.copy(this.v2).sub(this.v1),r.multiplyScalar(e).add(this.v1)),r}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new L){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},fc=class extends zt{constructor(e=new we,t=new we,r=new we){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=r}getPoint(e,t=new we){let r=t,i=this.v0,a=this.v1,n=this.v2;return r.set(Ri(e,i.x,a.x,n.x),Ri(e,i.y,a.y,n.y)),r}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},pa=class extends zt{constructor(e=new L,t=new L,r=new L){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=r}getPoint(e,t=new L){let r=t,i=this.v0,a=this.v1,n=this.v2;return r.set(Ri(e,i.x,a.x,n.x),Ri(e,i.y,a.y,n.y),Ri(e,i.z,a.z,n.z)),r}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},mc=class extends zt{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new we){let r=t,i=this.points,a=(i.length-1)*e,n=Math.floor(a),s=a-n,o=i[n===0?n:n-1],l=i[n],h=i[n>i.length-2?i.length-1:n+1],c=i[n>i.length-3?i.length-1:n+2];return r.set(xo(s,o.x,l.x,h.x,c.x),xo(s,o.y,l.y,h.y,c.y)),r}copy(e){super.copy(e),this.points=[];for(let t=0,r=e.points.length;t<r;t++){let i=e.points[t];this.points.push(i.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,r=this.points.length;t<r;t++){let i=this.points[t];e.points.push(i.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,r=e.points.length;t<r;t++){let i=e.points[t];this.points.push(new we().fromArray(i))}return this}},$n=Object.freeze({__proto__:null,ArcCurve:rc,CatmullRomCurve3:ic,CubicBezierCurve:uc,CubicBezierCurve3:dc,EllipseCurve:vo,LineCurve:pc,LineCurve3:da,QuadraticBezierCurve:fc,QuadraticBezierCurve3:pa,SplineCurve:mc}),gc=class extends zt{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let r=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new $n[r](t,e))}return this}getPoint(e,t){let r=e*this.getLength(),i=this.getCurveLengths(),a=0;for(;a<i.length;){if(i[a]>=r){let n=i[a]-r,s=this.curves[a],o=s.getLength(),l=o===0?0:1-n/o;return s.getPointAt(l,t)}a++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let r=0,i=this.curves.length;r<i;r++)t+=this.curves[r].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let r=0;r<=e;r++)t.push(this.getPoint(r/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],r;for(let i=0,a=this.curves;i<a.length;i++){let n=a[i],s=n.isEllipseCurve?e*2:n.isLineCurve||n.isLineCurve3?1:n.isSplineCurve?e*n.points.length:e,o=n.getPoints(s);for(let l=0;l<o.length;l++){let h=o[l];r&&r.equals(h)||(t.push(h),r=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,r=e.curves.length;t<r;t++){let i=e.curves[t];this.curves.push(i.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,r=this.curves.length;t<r;t++){let i=this.curves[t];e.curves.push(i.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,r=e.curves.length;t<r;t++){let i=e.curves[t];this.curves.push(new $n[i.type]().fromJSON(i))}return this}},_c=class ul extends Bt{constructor(t=[new we(0,-.5),new we(.5,0),new we(0,.5)],r=12,i=0,a=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:r,phiStart:i,phiLength:a},r=Math.floor(r),a=ze(a,0,Math.PI*2);let n=[],s=[],o=[],l=[],h=[],c=1/r,u=new L,d=new we,f=new L,x=new L,_=new L,m=0,p=0;for(let b=0;b<=t.length-1;b++)switch(b){case 0:m=t[b+1].x-t[b].x,p=t[b+1].y-t[b].y,f.x=p*1,f.y=-m,f.z=p*0,_.copy(f),f.normalize(),l.push(f.x,f.y,f.z);break;case t.length-1:l.push(_.x,_.y,_.z);break;default:m=t[b+1].x-t[b].x,p=t[b+1].y-t[b].y,f.x=p*1,f.y=-m,f.z=p*0,x.copy(f),f.x+=_.x,f.y+=_.y,f.z+=_.z,f.normalize(),l.push(f.x,f.y,f.z),_.copy(x)}for(let b=0;b<=r;b++){let M=i+b*c*a,T=Math.sin(M),D=Math.cos(M);for(let w=0;w<=t.length-1;w++){u.x=t[w].x*T,u.y=t[w].y,u.z=t[w].x*D,s.push(u.x,u.y,u.z),d.x=b/r,d.y=w/(t.length-1),o.push(d.x,d.y);let A=l[3*w+0]*T,O=l[3*w+1],E=l[3*w+0]*D;h.push(A,O,E)}}for(let b=0;b<r;b++)for(let M=0;M<t.length-1;M++){let T=M+b*t.length,D=T,w=T+t.length,A=T+t.length+1,O=T+1;n.push(D,w,O),n.push(A,O,w)}this.setIndex(n),this.setAttribute("position",new Qe(s,3)),this.setAttribute("uv",new Qe(o,2)),this.setAttribute("normal",new Qe(h,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ul(t.points,t.segments,t.phiStart,t.phiLength)}},Qn=class dl extends Bt{constructor(t=1,r=1,i=1,a=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:r,widthSegments:i,heightSegments:a};let n=t/2,s=r/2,o=Math.floor(i),l=Math.floor(a),h=o+1,c=l+1,u=t/o,d=r/l,f=[],x=[],_=[],m=[];for(let p=0;p<c;p++){let b=p*d-s;for(let M=0;M<h;M++){let T=M*u-n;x.push(T,-b,0),_.push(0,0,1),m.push(M/o),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let b=0;b<o;b++){let M=b+h*p,T=b+h*(p+1),D=b+1+h*(p+1),w=b+1+h*p;f.push(M,T,w),f.push(T,D,w)}this.setIndex(f),this.setAttribute("position",new Qe(x,3)),this.setAttribute("normal",new Qe(_,3)),this.setAttribute("uv",new Qe(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new dl(t.width,t.height,t.widthSegments,t.heightSegments)}},vc=class pl extends Bt{constructor(t=.5,r=1,i=32,a=1,n=0,s=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:r,thetaSegments:i,phiSegments:a,thetaStart:n,thetaLength:s},i=Math.max(3,i),a=Math.max(1,a);let o=[],l=[],h=[],c=[],u=t,d=(r-t)/a,f=new L,x=new we;for(let _=0;_<=a;_++){for(let m=0;m<=i;m++){let p=n+m/i*s;f.x=u*Math.cos(p),f.y=u*Math.sin(p),l.push(f.x,f.y,f.z),h.push(0,0,1),x.x=(f.x/r+1)/2,x.y=(f.y/r+1)/2,c.push(x.x,x.y)}u+=d}for(let _=0;_<a;_++){let m=_*(i+1);for(let p=0;p<i;p++){let b=p+m,M=b,T=b+i+1,D=b+i+2,w=b+1;o.push(M,T,w),o.push(T,D,w)}}this.setIndex(o),this.setAttribute("position",new Qe(l,3)),this.setAttribute("normal",new Qe(h,3)),this.setAttribute("uv",new Qe(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new pl(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}},fa=class fl extends Bt{constructor(t=1,r=32,i=16,a=0,n=Math.PI*2,s=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:r,heightSegments:i,phiStart:a,phiLength:n,thetaStart:s,thetaLength:o},r=Math.max(3,Math.floor(r)),i=Math.max(2,Math.floor(i));let l=Math.min(s+o,Math.PI),h=0,c=[],u=new L,d=new L,f=[],x=[],_=[],m=[];for(let p=0;p<=i;p++){let b=[],M=p/i,T=0;p===0&&s===0?T=.5/r:p===i&&l===Math.PI&&(T=-.5/r);for(let D=0;D<=r;D++){let w=D/r;u.x=-t*Math.cos(a+w*n)*Math.sin(s+M*o),u.y=t*Math.cos(s+M*o),u.z=t*Math.sin(a+w*n)*Math.sin(s+M*o),x.push(u.x,u.y,u.z),d.copy(u).normalize(),_.push(d.x,d.y,d.z),m.push(w+T,1-M),b.push(h++)}c.push(b)}for(let p=0;p<i;p++)for(let b=0;b<r;b++){let M=c[p][b+1],T=c[p][b],D=c[p+1][b],w=c[p+1][b+1];(p!==0||s>0)&&f.push(M,T,w),(p!==i-1||l<Math.PI)&&f.push(T,D,w)}this.setIndex(f),this.setAttribute("position",new Qe(x,3)),this.setAttribute("normal",new Qe(_,3)),this.setAttribute("uv",new Qe(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new fl(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}},yo=class ml extends Bt{constructor(t=1,r=.4,i=12,a=48,n=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:r,radialSegments:i,tubularSegments:a,arc:n},i=Math.floor(i),a=Math.floor(a);let s=[],o=[],l=[],h=[],c=new L,u=new L,d=new L;for(let f=0;f<=i;f++)for(let x=0;x<=a;x++){let _=x/a*n,m=f/i*Math.PI*2;u.x=(t+r*Math.cos(m))*Math.cos(_),u.y=(t+r*Math.cos(m))*Math.sin(_),u.z=r*Math.sin(m),o.push(u.x,u.y,u.z),c.x=t*Math.cos(_),c.y=t*Math.sin(_),d.subVectors(u,c).normalize(),l.push(d.x,d.y,d.z),h.push(x/a),h.push(f/i)}for(let f=1;f<=i;f++)for(let x=1;x<=a;x++){let _=(a+1)*f+x-1,m=(a+1)*(f-1)+x-1,p=(a+1)*(f-1)+x,b=(a+1)*f+x;s.push(_,m,b),s.push(m,p,b)}this.setIndex(s),this.setAttribute("position",new Qe(o,3)),this.setAttribute("normal",new Qe(l,3)),this.setAttribute("uv",new Qe(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ml(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}},es=class gl extends Bt{constructor(t=new pa(new L(-1,-1,0),new L(-1,1,0),new L(1,1,0)),r=64,i=1,a=8,n=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:r,radius:i,radialSegments:a,closed:n};let s=t.computeFrenetFrames(r,n);this.tangents=s.tangents,this.normals=s.normals,this.binormals=s.binormals;let o=new L,l=new L,h=new we,c=new L,u=[],d=[],f=[],x=[];_(),this.setIndex(x),this.setAttribute("position",new Qe(u,3)),this.setAttribute("normal",new Qe(d,3)),this.setAttribute("uv",new Qe(f,2));function _(){for(let M=0;M<r;M++)m(M);m(n===!1?r:0),b(),p()}function m(M){c=t.getPointAt(M/r,c);let T=s.normals[M],D=s.binormals[M];for(let w=0;w<=a;w++){let A=w/a*Math.PI*2,O=Math.sin(A),E=-Math.cos(A);l.x=E*T.x+O*D.x,l.y=E*T.y+O*D.y,l.z=E*T.z+O*D.z,l.normalize(),d.push(l.x,l.y,l.z),o.x=c.x+i*l.x,o.y=c.y+i*l.y,o.z=c.z+i*l.z,u.push(o.x,o.y,o.z)}}function p(){for(let M=1;M<=r;M++)for(let T=1;T<=a;T++){let D=(a+1)*(M-1)+(T-1),w=(a+1)*M+(T-1),A=(a+1)*M+T,O=(a+1)*(M-1)+T;x.push(D,w,O),x.push(w,A,O)}}function b(){for(let M=0;M<=r;M++)for(let T=0;T<=a;T++)h.x=M/r,h.y=T/a,f.push(h.x,h.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new gl(new $n[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}},xc=class extends bi{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new We(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new We(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Fs,this.normalScale=new we(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new mr,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},yc=class extends bi{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Ql,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Mc=class extends bi{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function ma(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT=="number"?new t(e):Array.prototype.slice.call(e)}function Sc(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}var ga=class{constructor(e,t,r,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(r),this.sampleValues=t,this.valueSize=r,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,r=this._cachedIndex,i=t[r],a=t[r-1];r:{e:{let n;t:{i:if(!(e<i)){for(let s=r+2;;){if(i===void 0){if(e<a)break i;return r=t.length,this._cachedIndex=r,this.copySampleValue_(r-1)}if(r===s)break;if(a=i,i=t[++r],e<i)break e}n=t.length;break t}if(!(e>=a)){let s=t[1];e<s&&(r=2,a=s);for(let o=r-2;;){if(a===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===o)break;if(i=a,a=t[--r-1],e>=a)break e}n=r,r=0;break t}break r}for(;r<n;){let s=r+n>>>1;e<t[s]?n=s:r=s+1}if(i=t[r],a=t[r-1],a===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return r=t.length,this._cachedIndex=r,this.copySampleValue_(r-1)}this._cachedIndex=r,this.intervalChanged_(r,a,i)}return this.interpolate_(r,a,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,r=this.sampleValues,i=this.valueSize,a=e*i;for(let n=0;n!==i;++n)t[n]=r[a+n];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Ec=class extends ga{constructor(e,t,r,i){super(e,t,r,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Is,endingEnd:Is}}intervalChanged_(e,t,r){let i=this.parameterPositions,a=e-2,n=e+1,s=i[a],o=i[n];if(s===void 0)switch(this.getSettings_().endingStart){case Ns:a=e,s=2*t-r;break;case Os:a=i.length-2,s=t+i[a]-i[a+1];break;default:a=e,s=r}if(o===void 0)switch(this.getSettings_().endingEnd){case Ns:n=e,o=2*r-t;break;case Os:n=1,o=r+i[1]-i[0];break;default:n=e-1,o=t}let l=(r-t)*.5,h=this.valueSize;this._weightPrev=l/(t-s),this._weightNext=l/(o-r),this._offsetPrev=a*h,this._offsetNext=n*h}interpolate_(e,t,r,i){let a=this.resultBuffer,n=this.sampleValues,s=this.valueSize,o=e*s,l=o-s,h=this._offsetPrev,c=this._offsetNext,u=this._weightPrev,d=this._weightNext,f=(r-t)/(i-t),x=f*f,_=x*f,m=-u*_+2*u*x-u*f,p=(1+u)*_+(-1.5-2*u)*x+(-.5+u)*f+1,b=(-1-d)*_+(1.5+d)*x+.5*f,M=d*_-d*x;for(let T=0;T!==s;++T)a[T]=m*n[h+T]+p*n[l+T]+b*n[o+T]+M*n[c+T];return a}},Tc=class extends ga{constructor(e,t,r,i){super(e,t,r,i)}interpolate_(e,t,r,i){let a=this.resultBuffer,n=this.sampleValues,s=this.valueSize,o=e*s,l=o-s,h=(r-t)/(i-t),c=1-h;for(let u=0;u!==s;++u)a[u]=n[l+u]*c+n[o+u]*h;return a}},bc=class extends ga{constructor(e,t,r,i){super(e,t,r,i)}interpolate_(e){return this.copySampleValue_(e-1)}},qt=class{constructor(e,t,r,i){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=ma(t,this.TimeBufferType),this.values=ma(r,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,r;if(t.toJSON!==this.toJSON)r=t.toJSON(e);else{r={name:e.name,times:ma(e.times,Array),values:ma(e.values,Array)};let i=e.getInterpolation();i!==e.DefaultInterpolation&&(r.interpolation=i)}return r.type=e.ValueTypeName,r}InterpolantFactoryMethodDiscrete(e){return new bc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Tc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Ec(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case ki:t=this.InterpolantFactoryMethodDiscrete;break;case xn:t=this.InterpolantFactoryMethodLinear;break;case yn:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let r="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(r);return console.warn("THREE.KeyframeTrack:",r),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return ki;case this.InterpolantFactoryMethodLinear:return xn;case this.InterpolantFactoryMethodSmooth:return yn}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let r=0,i=t.length;r!==i;++r)t[r]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let r=0,i=t.length;r!==i;++r)t[r]*=e}return this}trim(e,t){let r=this.times,i=r.length,a=0,n=i-1;for(;a!==i&&r[a]<e;)++a;for(;n!==-1&&r[n]>t;)--n;if(++n,a!==0||n!==i){a>=n&&(n=Math.max(n,1),a=n-1);let s=this.getValueSize();this.times=r.slice(a,n),this.values=this.values.slice(a*s,n*s)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let r=this.times,i=this.values,a=r.length;a===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let n=null;for(let s=0;s!==a;s++){let o=r[s];if(typeof o=="number"&&isNaN(o)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,s,o),e=!1;break}if(n!==null&&n>o){console.error("THREE.KeyframeTrack: Out of order keys.",this,s,o,n),e=!1;break}n=o}if(i!==void 0&&Sc(i))for(let s=0,o=i.length;s!==o;++s){let l=i[s];if(isNaN(l)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,s,l),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),r=this.getValueSize(),i=this.getInterpolation()===yn,a=e.length-1,n=1;for(let s=1;s<a;++s){let o=!1,l=e[s],h=e[s+1];if(l!==h&&(s!==1||l!==e[0]))if(i)o=!0;else{let c=s*r,u=c-r,d=c+r;for(let f=0;f!==r;++f){let x=t[c+f];if(x!==t[u+f]||x!==t[d+f]){o=!0;break}}}if(o){if(s!==n){e[n]=e[s];let c=s*r,u=n*r;for(let d=0;d!==r;++d)t[u+d]=t[c+d]}++n}}if(a>0){e[n]=e[a];for(let s=a*r,o=n*r,l=0;l!==r;++l)t[o+l]=t[s+l];++n}return n!==e.length?(this.times=e.slice(0,n),this.values=t.slice(0,n*r)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),r=this.constructor,i=new r(this.name,e,t);return i.createInterpolant=this.createInterpolant,i}};qt.prototype.ValueTypeName="",qt.prototype.TimeBufferType=Float32Array,qt.prototype.ValueBufferType=Float32Array,qt.prototype.DefaultInterpolation=xn;var Pi=class extends qt{constructor(e,t,r){super(e,t,r)}};Pi.prototype.ValueTypeName="bool",Pi.prototype.ValueBufferType=Array,Pi.prototype.DefaultInterpolation=ki,Pi.prototype.InterpolantFactoryMethodLinear=void 0,Pi.prototype.InterpolantFactoryMethodSmooth=void 0;var wc=class extends qt{constructor(e,t,r,i){super(e,t,r,i)}};wc.prototype.ValueTypeName="color";var Ac=class extends qt{constructor(e,t,r,i){super(e,t,r,i)}};Ac.prototype.ValueTypeName="number";var Rc=class extends ga{constructor(e,t,r,i){super(e,t,r,i)}interpolate_(e,t,r,i){let a=this.resultBuffer,n=this.sampleValues,s=this.valueSize,o=(r-t)/(i-t),l=e*s;for(let h=l+s;l!==h;l+=4)Wr.slerpFlat(a,0,n,l-s,n,l,o);return a}},Mo=class extends qt{constructor(e,t,r,i){super(e,t,r,i)}InterpolantFactoryMethodLinear(e){return new Rc(this.times,this.values,this.getValueSize(),e)}};Mo.prototype.ValueTypeName="quaternion",Mo.prototype.InterpolantFactoryMethodSmooth=void 0;var Ui=class extends qt{constructor(e,t,r){super(e,t,r)}};Ui.prototype.ValueTypeName="string",Ui.prototype.ValueBufferType=Array,Ui.prototype.DefaultInterpolation=ki,Ui.prototype.InterpolantFactoryMethodLinear=void 0,Ui.prototype.InterpolantFactoryMethodSmooth=void 0;var Cc=class extends qt{constructor(e,t,r,i){super(e,t,r,i)}};Cc.prototype.ValueTypeName="vector";var Pc=class{constructor(e,t,r){let i=this,a=!1,n=0,s=0,o,l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=r,this.abortController=new AbortController,this.itemStart=function(h){s++,a===!1&&i.onStart!==void 0&&i.onStart(h,n,s),a=!0},this.itemEnd=function(h){n++,i.onProgress!==void 0&&i.onProgress(h,n,s),n===s&&(a=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(h){i.onError!==void 0&&i.onError(h)},this.resolveURL=function(h){return o?o(h):h},this.setURLModifier=function(h){return o=h,this},this.addHandler=function(h,c){return l.push(h,c),this},this.removeHandler=function(h){let c=l.indexOf(h);return c!==-1&&l.splice(c,2),this},this.getHandler=function(h){for(let c=0,u=l.length;c<u;c+=2){let d=l[c],f=l[c+1];if(d.global&&(d.lastIndex=0),d.test(h))return f}return null},this.abort=function(){return this.abortController.abort(),this.abortController=new AbortController,this}}},Uc=new Pc,Lc=class{constructor(e){this.manager=e!==void 0?e:Uc,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let r=this;return new Promise(function(i,a){r.load(e,i,t,a)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Lc.DEFAULT_MATERIAL_NAME="__DEFAULT";var So=class extends Et{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new We(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},Dc=class extends So{constructor(e,t,r){super(e,r),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Et.DEFAULT_UP),this.updateMatrix(),this.groundColor=new We(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},ts=new ht,Eo=new L,To=new L,Ic=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new we(512,512),this.mapType=kt,this.map=null,this.mapPass=null,this.matrix=new ht,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new qn,this._frameExtents=new we(1,1),this._viewportCount=1,this._viewports=[new ot(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,r=this.matrix;Eo.setFromMatrixPosition(e.matrixWorld),t.position.copy(Eo),To.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(To),t.updateMatrixWorld(),ts.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ts,t.coordinateSystem,t.reversedDepth),t.reversedDepth?r.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):r.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),r.multiply(ts)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},bo=class extends uo{constructor(e=-1,t=1,r=1,i=-1,a=.1,n=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=r,this.bottom=i,this.near=a,this.far=n,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,r,i,a,n){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=r,this.view.offsetY=i,this.view.width=a,this.view.height=n,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),r=(this.right+this.left)/2,i=(this.top+this.bottom)/2,a=r-e,n=r+e,s=i+t,o=i-t;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=l*this.view.offsetX,n=a+l*this.view.width,s-=h*this.view.offsetY,o=s-h*this.view.height}this.projectionMatrix.makeOrthographic(a,n,s,o,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Nc=class extends Ic{constructor(){super(new bo(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},rs=class extends So{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Et.DEFAULT_UP),this.updateMatrix(),this.target=new Et,this.shadow=new Nc}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},Oc=class extends Ct{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}},is="\\[\\]\\.:\\/",Fc=new RegExp("["+is+"]","g"),as="[^"+is+"]",Bc="[^"+is.replace("\\.","")+"]",zc=/((?:WC+[\/:])*)/.source.replace("WC",as),Hc=/(WCOD+)?/.source.replace("WCOD",Bc),Vc=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",as),Gc=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",as),kc=new RegExp("^"+zc+Hc+Vc+Gc+"$"),Wc=["material","materials","bones","map"],Xc=class{constructor(e,t,r){let i=r||rt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,i)}getValue(e,t){this.bind();let r=this._targetGroup.nCachedObjects_,i=this._bindings[r];i!==void 0&&i.getValue(e,t)}setValue(e,t){let r=this._bindings;for(let i=this._targetGroup.nCachedObjects_,a=r.length;i!==a;++i)r[i].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,r=e.length;t!==r;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,r=e.length;t!==r;++t)e[t].unbind()}},rt=class ci{constructor(t,r,i){this.path=r,this.parsedPath=i||ci.parseTrackName(r),this.node=ci.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,r,i){return t&&t.isAnimationObjectGroup?new ci.Composite(t,r,i):new ci(t,r,i)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(Fc,"")}static parseTrackName(t){let r=kc.exec(t);if(r===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);let i={nodeName:r[2],objectName:r[3],objectIndex:r[4],propertyName:r[5],propertyIndex:r[6]},a=i.nodeName&&i.nodeName.lastIndexOf(".");if(a!==void 0&&a!==-1){let n=i.nodeName.substring(a+1);Wc.indexOf(n)!==-1&&(i.nodeName=i.nodeName.substring(0,a),i.objectName=n)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return i}static findNode(t,r){if(r===void 0||r===""||r==="."||r===-1||r===t.name||r===t.uuid)return t;if(t.skeleton){let i=t.skeleton.getBoneByName(r);if(i!==void 0)return i}if(t.children){let i=function(n){for(let s=0;s<n.length;s++){let o=n[s];if(o.name===r||o.uuid===r)return o;let l=i(o.children);if(l)return l}return null},a=i(t.children);if(a)return a}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,r){t[r]=this.targetObject[this.propertyName]}_getValue_array(t,r){let i=this.resolvedProperty;for(let a=0,n=i.length;a!==n;++a)t[r++]=i[a]}_getValue_arrayElement(t,r){t[r]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,r){this.resolvedProperty.toArray(t,r)}_setValue_direct(t,r){this.targetObject[this.propertyName]=t[r]}_setValue_direct_setNeedsUpdate(t,r){this.targetObject[this.propertyName]=t[r],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,r){this.targetObject[this.propertyName]=t[r],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,r){let i=this.resolvedProperty;for(let a=0,n=i.length;a!==n;++a)i[a]=t[r++]}_setValue_array_setNeedsUpdate(t,r){let i=this.resolvedProperty;for(let a=0,n=i.length;a!==n;++a)i[a]=t[r++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,r){let i=this.resolvedProperty;for(let a=0,n=i.length;a!==n;++a)i[a]=t[r++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,r){this.resolvedProperty[this.propertyIndex]=t[r]}_setValue_arrayElement_setNeedsUpdate(t,r){this.resolvedProperty[this.propertyIndex]=t[r],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,r){this.resolvedProperty[this.propertyIndex]=t[r],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,r){this.resolvedProperty.fromArray(t,r)}_setValue_fromArray_setNeedsUpdate(t,r){this.resolvedProperty.fromArray(t,r),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,r){this.resolvedProperty.fromArray(t,r),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,r){this.bind(),this.getValue(t,r)}_setValue_unbound(t,r){this.bind(),this.setValue(t,r)}bind(){let t=this.node,r=this.parsedPath,i=r.objectName,a=r.propertyName,n=r.propertyIndex;if(t||(t=ci.findNode(this.rootNode,r.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let h=r.objectIndex;switch(i){case"materials":if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let c=0;c<t.length;c++)if(t[c].name===h){h=c;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[i]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[i]}if(h!==void 0){if(t[h]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[h]}}let s=t[a];if(s===void 0){let h=r.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+h+"."+a+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?o=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(n!==void 0){if(a==="morphTargetInfluences"){if(!t.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[n]!==void 0&&(n=t.morphTargetDictionary[n])}l=this.BindingType.ArrayElement,this.resolvedProperty=s,this.propertyIndex=n}else s.fromArray!==void 0&&s.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=s):Array.isArray(s)?(l=this.BindingType.EntireArray,this.resolvedProperty=s):this.propertyName=a;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};rt.Composite=Xc,rt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},rt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},rt.prototype.GetterByBindingType=[rt.prototype._getValue_direct,rt.prototype._getValue_array,rt.prototype._getValue_arrayElement,rt.prototype._getValue_toArray],rt.prototype.SetterByBindingTypeAndVersioning=[[rt.prototype._setValue_direct,rt.prototype._setValue_direct_setNeedsUpdate,rt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[rt.prototype._setValue_array,rt.prototype._setValue_array_setNeedsUpdate,rt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[rt.prototype._setValue_arrayElement,rt.prototype._setValue_arrayElement_setNeedsUpdate,rt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[rt.prototype._setValue_fromArray,rt.prototype._setValue_fromArray_setNeedsUpdate,rt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Dm=new Float32Array(1);function wo(e,t,r,i){let a=jc(i);switch(r){case Cs:return e*t;case Us:return e*t/a.components*a.byteLength;case ka:return e*t/a.components*a.byteLength;case Ls:return e*t*2/a.components*a.byteLength;case Wa:return e*t*2/a.components*a.byteLength;case Ps:return e*t*3/a.components*a.byteLength;case Dt:return e*t*4/a.components*a.byteLength;case Xa:return e*t*4/a.components*a.byteLength;case Bi:case zi:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Hi:case Vi:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case qa:case Za:return Math.max(e,16)*Math.max(t,8)/4;case ja:case Ya:return Math.max(e,8)*Math.max(t,8)/2;case Ka:case Ja:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case $a:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Qa:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case en:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case tn:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case rn:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case an:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case nn:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case sn:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case on:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case ln:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case hn:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case cn:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case un:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case dn:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case pn:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Gi:case fn:case mn:return Math.ceil(e/4)*Math.ceil(t/4)*16;case Ds:case gn:return Math.ceil(e/4)*Math.ceil(t/4)*8;case _n:case vn:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${r} format.`)}function jc(e){switch(e){case kt:case ws:return{byteLength:1,components:1};case di:case As:case pi:return{byteLength:2,components:1};case Va:case Ga:return{byteLength:2,components:4};case Er:case Ha:case $t:return{byteLength:4,components:1};case Rs:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"179"}})),typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="179");/**
* @license
* Copyright 2010-2025 Three.js Authors
* SPDX-License-Identifier: MIT
*/function Ao(){let e=null,t=!1,r=null,i=null;function a(n,s){r(n,s),i=e.requestAnimationFrame(a)}return{start:function(){t!==!0&&r!==null&&(i=e.requestAnimationFrame(a),t=!0)},stop:function(){e.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(n){r=n},setContext:function(n){e=n}}}function qc(e){let t=new WeakMap;function r(o,l){let h=o.array,c=o.usage,u=h.byteLength,d=e.createBuffer();e.bindBuffer(l,d),e.bufferData(l,h,c),o.onUploadCallback();let f;if(h instanceof Float32Array)f=e.FLOAT;else if(typeof Float16Array<"u"&&h instanceof Float16Array)f=e.HALF_FLOAT;else if(h instanceof Uint16Array)o.isFloat16BufferAttribute?f=e.HALF_FLOAT:f=e.UNSIGNED_SHORT;else if(h instanceof Int16Array)f=e.SHORT;else if(h instanceof Uint32Array)f=e.UNSIGNED_INT;else if(h instanceof Int32Array)f=e.INT;else if(h instanceof Int8Array)f=e.BYTE;else if(h instanceof Uint8Array)f=e.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)f=e.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:d,type:f,bytesPerElement:h.BYTES_PER_ELEMENT,version:o.version,size:u}}function i(o,l,h){let c=l.array,u=l.updateRanges;if(e.bindBuffer(h,o),u.length===0)e.bufferSubData(h,0,c);else{u.sort((f,x)=>f.start-x.start);let d=0;for(let f=1;f<u.length;f++){let x=u[d],_=u[f];_.start<=x.start+x.count+1?x.count=Math.max(x.count,_.start+_.count-x.start):(++d,u[d]=_)}u.length=d+1;for(let f=0,x=u.length;f<x;f++){let _=u[f];e.bufferSubData(h,_.start*c.BYTES_PER_ELEMENT,c,_.start,_.count)}l.clearUpdateRanges()}l.onUploadCallback()}function a(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function n(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=t.get(o);l&&(e.deleteBuffer(l.buffer),t.delete(o))}function s(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let c=t.get(o);(!c||c.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let h=t.get(o);if(h===void 0)t.set(o,r(o,l));else if(h.version<o.version){if(h.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(h.buffer,o,l),h.version=o.version}}return{get:a,remove:n,update:s}}var Yc=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Zc=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Kc=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Jc=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,$c=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Qc=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,eu=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,tu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,ru=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,iu=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,au=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,nu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,su=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,ou=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,lu=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,hu=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,cu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,uu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,du=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,pu=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,fu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,mu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,gu=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,_u=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,vu=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,xu=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,yu=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Mu=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Su=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Eu=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Tu="gl_FragColor = linearToOutputTexel( gl_FragColor );",bu=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,wu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Au=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Ru=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Cu=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Pu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Uu=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Lu=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Du=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Iu=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Nu=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Ou=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Fu=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Bu=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,zu=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Hu=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Vu=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Gu=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,ku=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Wu=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Xu=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,ju=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,qu=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Yu=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Zu=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Ku=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Ju=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,$u=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Qu=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,ed=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,td=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,rd=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,id=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ad=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,nd=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,sd=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,od=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,ld=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,hd=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,cd=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,ud=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,dd=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,pd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,fd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,md=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,gd=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,_d=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,vd=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,xd=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,yd=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Md=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Sd=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Ed=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Td=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,bd=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,wd=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ad=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Rd=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Cd=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSEDEPTHBUF
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSEDEPTHBUF
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare , distribution.x );
		#endif
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Pd=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Ud=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Ld=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Dd=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Id=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Nd=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Od=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Fd=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Bd=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,zd=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Hd=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Vd=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Gd=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,kd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Wd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Xd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,jd=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,qd=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Yd=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Zd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Kd=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Jd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,$d=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Qd=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,ep=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSEDEPTHBUF
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,tp=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,rp=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,ip=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,ap=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,np=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sp=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,op=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,lp=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,hp=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,cp=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,up=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,dp=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,pp=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,fp=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,mp=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,gp=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_p=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,vp=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,xp=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,yp=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Mp=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Sp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ep=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Tp=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,bp=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,wp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Be={alphahash_fragment:Yc,alphahash_pars_fragment:Zc,alphamap_fragment:Kc,alphamap_pars_fragment:Jc,alphatest_fragment:$c,alphatest_pars_fragment:Qc,aomap_fragment:eu,aomap_pars_fragment:tu,batching_pars_vertex:ru,batching_vertex:iu,begin_vertex:au,beginnormal_vertex:nu,bsdfs:su,iridescence_fragment:ou,bumpmap_pars_fragment:lu,clipping_planes_fragment:hu,clipping_planes_pars_fragment:cu,clipping_planes_pars_vertex:uu,clipping_planes_vertex:du,color_fragment:pu,color_pars_fragment:fu,color_pars_vertex:mu,color_vertex:gu,common:_u,cube_uv_reflection_fragment:vu,defaultnormal_vertex:xu,displacementmap_pars_vertex:yu,displacementmap_vertex:Mu,emissivemap_fragment:Su,emissivemap_pars_fragment:Eu,colorspace_fragment:Tu,colorspace_pars_fragment:bu,envmap_fragment:wu,envmap_common_pars_fragment:Au,envmap_pars_fragment:Ru,envmap_pars_vertex:Cu,envmap_physical_pars_fragment:Hu,envmap_vertex:Pu,fog_vertex:Uu,fog_pars_vertex:Lu,fog_fragment:Du,fog_pars_fragment:Iu,gradientmap_pars_fragment:Nu,lightmap_pars_fragment:Ou,lights_lambert_fragment:Fu,lights_lambert_pars_fragment:Bu,lights_pars_begin:zu,lights_toon_fragment:Vu,lights_toon_pars_fragment:Gu,lights_phong_fragment:ku,lights_phong_pars_fragment:Wu,lights_physical_fragment:Xu,lights_physical_pars_fragment:ju,lights_fragment_begin:qu,lights_fragment_maps:Yu,lights_fragment_end:Zu,logdepthbuf_fragment:Ku,logdepthbuf_pars_fragment:Ju,logdepthbuf_pars_vertex:$u,logdepthbuf_vertex:Qu,map_fragment:ed,map_pars_fragment:td,map_particle_fragment:rd,map_particle_pars_fragment:id,metalnessmap_fragment:ad,metalnessmap_pars_fragment:nd,morphinstance_vertex:sd,morphcolor_vertex:od,morphnormal_vertex:ld,morphtarget_pars_vertex:hd,morphtarget_vertex:cd,normal_fragment_begin:ud,normal_fragment_maps:dd,normal_pars_fragment:pd,normal_pars_vertex:fd,normal_vertex:md,normalmap_pars_fragment:gd,clearcoat_normal_fragment_begin:_d,clearcoat_normal_fragment_maps:vd,clearcoat_pars_fragment:xd,iridescence_pars_fragment:yd,opaque_fragment:Md,packing:Sd,premultiplied_alpha_fragment:Ed,project_vertex:Td,dithering_fragment:bd,dithering_pars_fragment:wd,roughnessmap_fragment:Ad,roughnessmap_pars_fragment:Rd,shadowmap_pars_fragment:Cd,shadowmap_pars_vertex:Pd,shadowmap_vertex:Ud,shadowmask_pars_fragment:Ld,skinbase_vertex:Dd,skinning_pars_vertex:Id,skinning_vertex:Nd,skinnormal_vertex:Od,specularmap_fragment:Fd,specularmap_pars_fragment:Bd,tonemapping_fragment:zd,tonemapping_pars_fragment:Hd,transmission_fragment:Vd,transmission_pars_fragment:Gd,uv_pars_fragment:kd,uv_pars_vertex:Wd,uv_vertex:Xd,worldpos_vertex:jd,background_vert:qd,background_frag:Yd,backgroundCube_vert:Zd,backgroundCube_frag:Kd,cube_vert:Jd,cube_frag:$d,depth_vert:Qd,depth_frag:ep,distanceRGBA_vert:tp,distanceRGBA_frag:rp,equirect_vert:ip,equirect_frag:ap,linedashed_vert:np,linedashed_frag:sp,meshbasic_vert:op,meshbasic_frag:lp,meshlambert_vert:hp,meshlambert_frag:cp,meshmatcap_vert:up,meshmatcap_frag:dp,meshnormal_vert:pp,meshnormal_frag:fp,meshphong_vert:mp,meshphong_frag:gp,meshphysical_vert:_p,meshphysical_frag:vp,meshtoon_vert:xp,meshtoon_frag:yp,points_vert:Mp,points_frag:Sp,shadow_vert:Ep,shadow_frag:Tp,sprite_vert:bp,sprite_frag:wp},se={common:{diffuse:{value:new We(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new He},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new He}},envmap:{envMap:{value:null},envMapRotation:{value:new He},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new He}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new He}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new He},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new He},normalScale:{value:new we(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new He},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new He}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new He}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new He}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new We(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new We(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0},uvTransform:{value:new He}},sprite:{diffuse:{value:new We(16777215)},opacity:{value:1},center:{value:new we(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new He},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0}}},Yt={basic:{uniforms:vt([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.fog]),vertexShader:Be.meshbasic_vert,fragmentShader:Be.meshbasic_frag},lambert:{uniforms:vt([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.fog,se.lights,{emissive:{value:new We(0)}}]),vertexShader:Be.meshlambert_vert,fragmentShader:Be.meshlambert_frag},phong:{uniforms:vt([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.fog,se.lights,{emissive:{value:new We(0)},specular:{value:new We(1118481)},shininess:{value:30}}]),vertexShader:Be.meshphong_vert,fragmentShader:Be.meshphong_frag},standard:{uniforms:vt([se.common,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.roughnessmap,se.metalnessmap,se.fog,se.lights,{emissive:{value:new We(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Be.meshphysical_vert,fragmentShader:Be.meshphysical_frag},toon:{uniforms:vt([se.common,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.gradientmap,se.fog,se.lights,{emissive:{value:new We(0)}}]),vertexShader:Be.meshtoon_vert,fragmentShader:Be.meshtoon_frag},matcap:{uniforms:vt([se.common,se.bumpmap,se.normalmap,se.displacementmap,se.fog,{matcap:{value:null}}]),vertexShader:Be.meshmatcap_vert,fragmentShader:Be.meshmatcap_frag},points:{uniforms:vt([se.points,se.fog]),vertexShader:Be.points_vert,fragmentShader:Be.points_frag},dashed:{uniforms:vt([se.common,se.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Be.linedashed_vert,fragmentShader:Be.linedashed_frag},depth:{uniforms:vt([se.common,se.displacementmap]),vertexShader:Be.depth_vert,fragmentShader:Be.depth_frag},normal:{uniforms:vt([se.common,se.bumpmap,se.normalmap,se.displacementmap,{opacity:{value:1}}]),vertexShader:Be.meshnormal_vert,fragmentShader:Be.meshnormal_frag},sprite:{uniforms:vt([se.sprite,se.fog]),vertexShader:Be.sprite_vert,fragmentShader:Be.sprite_frag},background:{uniforms:{uvTransform:{value:new He},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Be.background_vert,fragmentShader:Be.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new He}},vertexShader:Be.backgroundCube_vert,fragmentShader:Be.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Be.cube_vert,fragmentShader:Be.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Be.equirect_vert,fragmentShader:Be.equirect_frag},distanceRGBA:{uniforms:vt([se.common,se.displacementmap,{referencePosition:{value:new L},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Be.distanceRGBA_vert,fragmentShader:Be.distanceRGBA_frag},shadow:{uniforms:vt([se.lights,se.fog,{color:{value:new We(0)},opacity:{value:1}}]),vertexShader:Be.shadow_vert,fragmentShader:Be.shadow_frag}};Yt.physical={uniforms:vt([Yt.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new He},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new He},clearcoatNormalScale:{value:new we(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new He},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new He},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new He},sheen:{value:0},sheenColor:{value:new We(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new He},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new He},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new He},transmissionSamplerSize:{value:new we},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new He},attenuationDistance:{value:0},attenuationColor:{value:new We(0)},specularColor:{value:new We(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new He},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new He},anisotropyVector:{value:new we},anisotropyMap:{value:null},anisotropyMapTransform:{value:new He}}]),vertexShader:Be.meshphysical_vert,fragmentShader:Be.meshphysical_frag};var _a={r:0,b:0,g:0},Pr=new mr,Ap=new ht;function Rp(e,t,r,i,a,n,s){let o=new We(0),l=n===!0?0:1,h,c,u=null,d=0,f=null;function x(M){let T=M.isScene===!0?M.background:null;return T&&T.isTexture&&(T=(M.backgroundBlurriness>0?r:t).get(T)),T}function _(M){let T=!1,D=x(M);D===null?p(o,l):D&&D.isColor&&(p(D,1),T=!0);let w=e.xr.getEnvironmentBlendMode();w==="additive"?i.buffers.color.setClear(0,0,0,1,s):w==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,s),(e.autoClear||T)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function m(M,T){let D=x(T);D&&(D.isCubeTexture||D.mapping===Ni)?(c===void 0&&(c=new bt(new Wn(1,1,1),new sr({name:"BackgroundCubeMaterial",uniforms:ii(Yt.backgroundCube.uniforms),vertexShader:Yt.backgroundCube.vertexShader,fragmentShader:Yt.backgroundCube.fragmentShader,side:xt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(w,A,O){this.matrixWorld.copyPosition(O.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),a.update(c)),Pr.copy(T.backgroundRotation),Pr.x*=-1,Pr.y*=-1,Pr.z*=-1,D.isCubeTexture&&D.isRenderTargetTexture===!1&&(Pr.y*=-1,Pr.z*=-1),c.material.uniforms.envMap.value=D,c.material.uniforms.flipEnvMap.value=D.isCubeTexture&&D.isRenderTargetTexture===!1?-1:1,c.material.uniforms.backgroundBlurriness.value=T.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Ap.makeRotationFromEuler(Pr)),c.material.toneMapped=Xe.getTransfer(D.colorSpace)!==Ye,(u!==D||d!==D.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=D,d=D.version,f=e.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null)):D&&D.isTexture&&(h===void 0&&(h=new bt(new Qn(2,2),new sr({name:"BackgroundMaterial",uniforms:ii(Yt.background.uniforms),vertexShader:Yt.background.vertexShader,fragmentShader:Yt.background.fragmentShader,side:or,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),Object.defineProperty(h.material,"map",{get:function(){return this.uniforms.t2D.value}}),a.update(h)),h.material.uniforms.t2D.value=D,h.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,h.material.toneMapped=Xe.getTransfer(D.colorSpace)!==Ye,D.matrixAutoUpdate===!0&&D.updateMatrix(),h.material.uniforms.uvTransform.value.copy(D.matrix),(u!==D||d!==D.version||f!==e.toneMapping)&&(h.material.needsUpdate=!0,u=D,d=D.version,f=e.toneMapping),h.layers.enableAll(),M.unshift(h,h.geometry,h.material,0,0,null))}function p(M,T){M.getRGB(_a,co(e)),i.buffers.color.setClear(_a.r,_a.g,_a.b,T,s)}function b(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0)}return{getClearColor:function(){return o},setClearColor:function(M,T=1){o.set(M),l=T,p(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(M){l=M,p(o,l)},render:_,addToRenderList:m,dispose:b}}function Cp(e,t){let r=e.getParameter(e.MAX_VERTEX_ATTRIBS),i={},a=d(null),n=a,s=!1;function o(y,U,V,B,X){let Y=!1,k=u(B,V,U);n!==k&&(n=k,h(n.object)),Y=f(y,B,V,X),Y&&x(y,B,V,X),X!==null&&t.update(X,e.ELEMENT_ARRAY_BUFFER),(Y||s)&&(s=!1,T(y,U,V,B),X!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(X).buffer))}function l(){return e.createVertexArray()}function h(y){return e.bindVertexArray(y)}function c(y){return e.deleteVertexArray(y)}function u(y,U,V){let B=V.wireframe===!0,X=i[y.id];X===void 0&&(X={},i[y.id]=X);let Y=X[U.id];Y===void 0&&(Y={},X[U.id]=Y);let k=Y[B];return k===void 0&&(k=d(l()),Y[B]=k),k}function d(y){let U=[],V=[],B=[];for(let X=0;X<r;X++)U[X]=0,V[X]=0,B[X]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:V,attributeDivisors:B,object:y,attributes:{},index:null}}function f(y,U,V,B){let X=n.attributes,Y=U.attributes,k=0,$=V.getAttributes();for(let q in $)if($[q].location>=0){let K=X[q],me=Y[q];if(me===void 0&&(q==="instanceMatrix"&&y.instanceMatrix&&(me=y.instanceMatrix),q==="instanceColor"&&y.instanceColor&&(me=y.instanceColor)),K===void 0||K.attribute!==me||me&&K.data!==me.data)return!0;k++}return n.attributesNum!==k||n.index!==B}function x(y,U,V,B){let X={},Y=U.attributes,k=0,$=V.getAttributes();for(let q in $)if($[q].location>=0){let K=Y[q];K===void 0&&(q==="instanceMatrix"&&y.instanceMatrix&&(K=y.instanceMatrix),q==="instanceColor"&&y.instanceColor&&(K=y.instanceColor));let me={};me.attribute=K,K&&K.data&&(me.data=K.data),X[q]=me,k++}n.attributes=X,n.attributesNum=k,n.index=B}function _(){let y=n.newAttributes;for(let U=0,V=y.length;U<V;U++)y[U]=0}function m(y){p(y,0)}function p(y,U){let V=n.newAttributes,B=n.enabledAttributes,X=n.attributeDivisors;V[y]=1,B[y]===0&&(e.enableVertexAttribArray(y),B[y]=1),X[y]!==U&&(e.vertexAttribDivisor(y,U),X[y]=U)}function b(){let y=n.newAttributes,U=n.enabledAttributes;for(let V=0,B=U.length;V<B;V++)U[V]!==y[V]&&(e.disableVertexAttribArray(V),U[V]=0)}function M(y,U,V,B,X,Y,k){k===!0?e.vertexAttribIPointer(y,U,V,X,Y):e.vertexAttribPointer(y,U,V,B,X,Y)}function T(y,U,V,B){_();let X=B.attributes,Y=V.getAttributes(),k=U.defaultAttributeValues;for(let $ in Y){let q=Y[$];if(q.location>=0){let K=X[$];if(K===void 0&&($==="instanceMatrix"&&y.instanceMatrix&&(K=y.instanceMatrix),$==="instanceColor"&&y.instanceColor&&(K=y.instanceColor)),K!==void 0){let me=K.normalized,De=K.itemSize,Pe=t.get(K);if(Pe===void 0)continue;let Fe=Pe.buffer,j=Pe.type,re=Pe.bytesPerElement,ye=j===e.INT||j===e.UNSIGNED_INT||K.gpuType===Ha;if(K.isInterleavedBufferAttribute){let de=K.data,he=de.stride,Re=K.offset;if(de.isInstancedInterleavedBuffer){for(let Ne=0;Ne<q.locationSize;Ne++)p(q.location+Ne,de.meshPerAttribute);y.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=de.meshPerAttribute*de.count)}else for(let Ne=0;Ne<q.locationSize;Ne++)m(q.location+Ne);e.bindBuffer(e.ARRAY_BUFFER,Fe);for(let Ne=0;Ne<q.locationSize;Ne++)M(q.location+Ne,De/q.locationSize,j,me,he*re,(Re+De/q.locationSize*Ne)*re,ye)}else{if(K.isInstancedBufferAttribute){for(let de=0;de<q.locationSize;de++)p(q.location+de,K.meshPerAttribute);y.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=K.meshPerAttribute*K.count)}else for(let de=0;de<q.locationSize;de++)m(q.location+de);e.bindBuffer(e.ARRAY_BUFFER,Fe);for(let de=0;de<q.locationSize;de++)M(q.location+de,De/q.locationSize,j,me,De*re,De/q.locationSize*de*re,ye)}}else if(k!==void 0){let me=k[$];if(me!==void 0)switch(me.length){case 2:e.vertexAttrib2fv(q.location,me);break;case 3:e.vertexAttrib3fv(q.location,me);break;case 4:e.vertexAttrib4fv(q.location,me);break;default:e.vertexAttrib1fv(q.location,me)}}}}b()}function D(){O();for(let y in i){let U=i[y];for(let V in U){let B=U[V];for(let X in B)c(B[X].object),delete B[X];delete U[V]}delete i[y]}}function w(y){if(i[y.id]===void 0)return;let U=i[y.id];for(let V in U){let B=U[V];for(let X in B)c(B[X].object),delete B[X];delete U[V]}delete i[y.id]}function A(y){for(let U in i){let V=i[U];if(V[y.id]===void 0)continue;let B=V[y.id];for(let X in B)c(B[X].object),delete B[X];delete V[y.id]}}function O(){E(),s=!0,n!==a&&(n=a,h(n.object))}function E(){a.geometry=null,a.program=null,a.wireframe=!1}return{setup:o,reset:O,resetDefaultState:E,dispose:D,releaseStatesOfGeometry:w,releaseStatesOfProgram:A,initAttributes:_,enableAttribute:m,disableUnusedAttributes:b}}function Pp(e,t,r){let i;function a(h){i=h}function n(h,c){e.drawArrays(i,h,c),r.update(c,i,1)}function s(h,c,u){u!==0&&(e.drawArraysInstanced(i,h,c,u),r.update(c,i,u))}function o(h,c,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,h,0,c,0,u);let d=0;for(let f=0;f<u;f++)d+=c[f];r.update(d,i,1)}function l(h,c,u,d){if(u===0)return;let f=t.get("WEBGL_multi_draw");if(f===null)for(let x=0;x<h.length;x++)s(h[x],c[x],d[x]);else{f.multiDrawArraysInstancedWEBGL(i,h,0,c,0,d,0,u);let x=0;for(let _=0;_<u;_++)x+=c[_]*d[_];r.update(x,i,1)}}this.setMode=a,this.render=n,this.renderInstances=s,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function Up(e,t,r,i){let a;function n(){if(a!==void 0)return a;if(t.has("EXT_texture_filter_anisotropic")===!0){let A=t.get("EXT_texture_filter_anisotropic");a=e.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else a=0;return a}function s(A){return!(A!==Dt&&i.convert(A)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(A){let O=A===pi&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(A!==kt&&i.convert(A)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE)&&A!==$t&&!O)}function l(A){if(A==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let h=r.precision!==void 0?r.precision:"highp",c=l(h);c!==h&&(console.warn("THREE.WebGLRenderer:",h,"not supported, using",c,"instead."),h=c);let u=r.logarithmicDepthBuffer===!0,d=r.reversedDepthBuffer===!0&&t.has("EXT_clip_control"),f=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),x=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=e.getParameter(e.MAX_TEXTURE_SIZE),m=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),p=e.getParameter(e.MAX_VERTEX_ATTRIBS),b=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),M=e.getParameter(e.MAX_VARYING_VECTORS),T=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),D=x>0,w=e.getParameter(e.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:n,getMaxPrecision:l,textureFormatReadable:s,textureTypeReadable:o,precision:h,logarithmicDepthBuffer:u,reversedDepthBuffer:d,maxTextures:f,maxVertexTextures:x,maxTextureSize:_,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:b,maxVaryings:M,maxFragmentUniforms:T,vertexTextures:D,maxSamples:w}}function Lp(e){let t=this,r=null,i=0,a=!1,n=!1,s=new Rr,o=new He,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let f=u.length!==0||d||i!==0||a;return a=d,i=u.length,f},this.beginShadows=function(){n=!0,c(null)},this.endShadows=function(){n=!1},this.setGlobalState=function(u,d){r=c(u,d,0)},this.setState=function(u,d,f){let x=u.clippingPlanes,_=u.clipIntersection,m=u.clipShadows,p=e.get(u);if(!a||x===null||x.length===0||n&&!m)n?c(null):h();else{let b=n?0:i,M=b*4,T=p.clippingState||null;l.value=T,T=c(x,d,M,f);for(let D=0;D!==M;++D)T[D]=r[D];p.clippingState=T,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=b}};function h(){l.value!==r&&(l.value=r,l.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function c(u,d,f,x){let _=u!==null?u.length:0,m=null;if(_!==0){if(m=l.value,x!==!0||m===null){let p=f+_*4,b=d.matrixWorldInverse;o.getNormalMatrix(b),(m===null||m.length<p)&&(m=new Float32Array(p));for(let M=0,T=f;M!==_;++M,T+=4)s.copy(u[M]).applyMatrix4(b,o),s.normal.toArray(m,T),m[T+3]=s.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,m}}function Dp(e){let t=new WeakMap;function r(s,o){return o===Oa?s.mapping=Fr:o===Fa&&(s.mapping=Br),s}function i(s){if(s&&s.isTexture){let o=s.mapping;if(o===Oa||o===Fa)if(t.has(s)){let l=t.get(s).texture;return r(l,s.mapping)}else{let l=s.image;if(l&&l.height>0){let h=new Kh(l.height);return h.fromEquirectangularTexture(e,s),t.set(s,h),s.addEventListener("dispose",a),r(h.texture,s.mapping)}else return null}}return s}function a(s){let o=s.target;o.removeEventListener("dispose",a);let l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function n(){t=new WeakMap}return{get:i,dispose:n}}var si=4,Ro=[.125,.215,.35,.446,.526,.582],Ur=20,ns=new bo,Co=new We,ss=null,os=0,ls=0,hs=!1,Lr=(1+Math.sqrt(5))/2,oi=1/Lr,Po=[new L(-Lr,oi,0),new L(Lr,oi,0),new L(-oi,0,Lr),new L(oi,0,Lr),new L(0,Lr,-oi),new L(0,Lr,oi),new L(-1,1,-1),new L(1,1,-1),new L(-1,1,1),new L(1,1,1)],Ip=new L,Uo=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,r=.1,i=100,a={}){let{size:n=256,position:s=Ip}=a;ss=this._renderer.getRenderTarget(),os=this._renderer.getActiveCubeFace(),ls=this._renderer.getActiveMipmapLevel(),hs=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(n);let o=this._allocateTargets();return o.depthBuffer=!0,this._sceneToCubeUV(e,r,i,o,s),t>0&&this._blur(o,0,0,t),this._applyPMREM(o),this._cleanup(o),o}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Io(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Do(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(ss,os,ls),this._renderer.xr.enabled=hs,e.scissorTest=!1,va(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Fr||e.mapping===Br?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),ss=this._renderer.getRenderTarget(),os=this._renderer.getActiveCubeFace(),ls=this._renderer.getActiveMipmapLevel(),hs=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let r=t||this._allocateTargets();return this._textureToCubeUV(e,r),this._applyPMREM(r),this._cleanup(r),r}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,r={magFilter:Gt,minFilter:Gt,generateMipmaps:!1,type:pi,format:Dt,colorSpace:zr,depthBuffer:!1},i=Lo(e,t,r);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Lo(e,t,r);let{_lodMax:a}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Np(a)),this._blurMaterial=Op(a,e,t)}return i}_compileMaterial(e){let t=new bt(this._lodPlanes[0],e);this._renderer.compile(t,ns)}_sceneToCubeUV(e,t,r,i,a){let n=new Ct(90,1,t,r),s=[1,-1,1,1,1,1],o=[1,1,1,-1,-1,-1],l=this._renderer,h=l.autoClear,c=l.toneMapping;l.getClearColor(Co),l.toneMapping=hr,l.autoClear=!1,l.state.buffers.depth.getReversed()&&(l.setRenderTarget(i),l.clearDepth(),l.setRenderTarget(null));let u=new wi({name:"PMREM.Background",side:xt,depthWrite:!1,depthTest:!1}),d=new bt(new Wn,u),f=!1,x=e.background;x?x.isColor&&(u.color.copy(x),e.background=null,f=!0):(u.color.copy(Co),f=!0);for(let _=0;_<6;_++){let m=_%3;m===0?(n.up.set(0,s[_],0),n.position.set(a.x,a.y,a.z),n.lookAt(a.x+o[_],a.y,a.z)):m===1?(n.up.set(0,0,s[_]),n.position.set(a.x,a.y,a.z),n.lookAt(a.x,a.y+o[_],a.z)):(n.up.set(0,s[_],0),n.position.set(a.x,a.y,a.z),n.lookAt(a.x,a.y,a.z+o[_]));let p=this._cubeSize;va(i,m*p,_>2?p:0,p,p),l.setRenderTarget(i),f&&l.render(d,n),l.render(e,n)}d.geometry.dispose(),d.material.dispose(),l.toneMapping=c,l.autoClear=h,e.background=x}_textureToCubeUV(e,t){let r=this._renderer,i=e.mapping===Fr||e.mapping===Br;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Io()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Do());let a=i?this._cubemapMaterial:this._equirectMaterial,n=new bt(this._lodPlanes[0],a),s=a.uniforms;s.envMap.value=e;let o=this._cubeSize;va(t,0,0,3*o,2*o),r.setRenderTarget(t),r.render(n,ns)}_applyPMREM(e){let t=this._renderer,r=t.autoClear;t.autoClear=!1;let i=this._lodPlanes.length;for(let a=1;a<i;a++){let n=Math.sqrt(this._sigmas[a]*this._sigmas[a]-this._sigmas[a-1]*this._sigmas[a-1]),s=Po[(i-a-1)%Po.length];this._blur(e,a-1,a,n,s)}t.autoClear=r}_blur(e,t,r,i,a){let n=this._pingPongRenderTarget;this._halfBlur(e,n,t,r,i,"latitudinal",a),this._halfBlur(n,e,r,r,i,"longitudinal",a)}_halfBlur(e,t,r,i,a,n,s){let o=this._renderer,l=this._blurMaterial;n!=="latitudinal"&&n!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,c=new bt(this._lodPlanes[i],l),u=l.uniforms,d=this._sizeLods[r]-1,f=isFinite(a)?Math.PI/(2*d):2*Math.PI/(2*Ur-1),x=a/f,_=isFinite(a)?1+Math.floor(h*x):Ur;_>Ur&&console.warn(`sigmaRadians, ${a}, is too large and will clip, as it requested ${_} samples when the maximum is set to ${Ur}`);let m=[],p=0;for(let w=0;w<Ur;++w){let A=w/x,O=Math.exp(-A*A/2);m.push(O),w===0?p+=O:w<_&&(p+=2*O)}for(let w=0;w<m.length;w++)m[w]=m[w]/p;u.envMap.value=e.texture,u.samples.value=_,u.weights.value=m,u.latitudinal.value=n==="latitudinal",s&&(u.poleAxis.value=s);let{_lodMax:b}=this;u.dTheta.value=f,u.mipInt.value=b-r;let M=this._sizeLods[i],T=3*M*(i>b-si?i-b+si:0),D=4*(this._cubeSize-M);va(t,T,D,3*M,2*M),o.setRenderTarget(t),o.render(c,ns)}};function Np(e){let t=[],r=[],i=[],a=e,n=e-si+1+Ro.length;for(let s=0;s<n;s++){let o=Math.pow(2,a);r.push(o);let l=1/o;s>e-si?l=Ro[s-e+si-1]:s===0&&(l=0),i.push(l);let h=1/(o-2),c=-h,u=1+h,d=[c,c,u,c,u,u,c,c,u,u,c,u],f=6,x=6,_=3,m=2,p=1,b=new Float32Array(_*x*f),M=new Float32Array(m*x*f),T=new Float32Array(p*x*f);for(let w=0;w<f;w++){let A=w%3*2/3-1,O=w>2?0:-1,E=[A,O,0,A+2/3,O,0,A+2/3,O+1,0,A,O,0,A+2/3,O+1,0,A,O+1,0];b.set(E,_*x*w),M.set(d,m*x*w);let y=[w,w,w,w,w,w];T.set(y,p*x*w)}let D=new Bt;D.setAttribute("position",new Xt(b,_)),D.setAttribute("uv",new Xt(M,m)),D.setAttribute("faceIndex",new Xt(T,p)),t.push(D),a>si&&a--}return{lodPlanes:t,sizeLods:r,sigmas:i}}function Lo(e,t,r){let i=new Tr(e,t,r);return i.texture.mapping=Ni,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function va(e,t,r,i,a){e.viewport.set(t,r,i,a),e.scissor.set(t,r,i,a)}function Op(e,t,r){let i=new Float32Array(Ur),a=new L(0,1,0);return new sr({name:"SphericalGaussianBlur",defines:{n:Ur,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/r,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:a}},vertexShader:cs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:lr,depthTest:!1,depthWrite:!1})}function Do(){return new sr({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:cs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:lr,depthTest:!1,depthWrite:!1})}function Io(){return new sr({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:cs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:lr,depthTest:!1,depthWrite:!1})}function cs(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Fp(e){let t=new WeakMap,r=null;function i(o){if(o&&o.isTexture){let l=o.mapping,h=l===Oa||l===Fa,c=l===Fr||l===Br;if(h||c){let u=t.get(o),d=u!==void 0?u.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==d)return r===null&&(r=new Uo(e)),u=h?r.fromEquirectangular(o,u):r.fromCubemap(o,u),u.texture.pmremVersion=o.pmremVersion,t.set(o,u),u.texture;if(u!==void 0)return u.texture;{let f=o.image;return h&&f&&f.height>0||c&&f&&a(f)?(r===null&&(r=new Uo(e)),u=h?r.fromEquirectangular(o):r.fromCubemap(o),u.texture.pmremVersion=o.pmremVersion,t.set(o,u),o.addEventListener("dispose",n),u.texture):null}}}return o}function a(o){let l=0,h=6;for(let c=0;c<h;c++)o[c]!==void 0&&l++;return l===h}function n(o){let l=o.target;l.removeEventListener("dispose",n);let h=t.get(l);h!==void 0&&(t.delete(l),h.dispose())}function s(){t=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:s}}function Bp(e){let t={};function r(i){if(t[i]!==void 0)return t[i];let a;switch(i){case"WEBGL_depth_texture":a=e.getExtension("WEBGL_depth_texture")||e.getExtension("MOZ_WEBGL_depth_texture")||e.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":a=e.getExtension("EXT_texture_filter_anisotropic")||e.getExtension("MOZ_EXT_texture_filter_anisotropic")||e.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":a=e.getExtension("WEBGL_compressed_texture_s3tc")||e.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||e.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":a=e.getExtension("WEBGL_compressed_texture_pvrtc")||e.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:a=e.getExtension(i)}return t[i]=a,a}return{has:function(i){return r(i)!==null},init:function(){r("EXT_color_buffer_float"),r("WEBGL_clip_cull_distance"),r("OES_texture_float_linear"),r("EXT_color_buffer_half_float"),r("WEBGL_multisampled_render_to_texture"),r("WEBGL_render_shared_exponent")},get:function(i){let a=r(i);return a===null&&Xr("THREE.WebGLRenderer: "+i+" extension not supported."),a}}}function zp(e,t,r,i){let a={},n=new WeakMap;function s(u){let d=u.target;d.index!==null&&t.remove(d.index);for(let x in d.attributes)t.remove(d.attributes[x]);d.removeEventListener("dispose",s),delete a[d.id];let f=n.get(d);f&&(t.remove(f),n.delete(d)),i.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,r.memory.geometries--}function o(u,d){return a[d.id]===!0||(d.addEventListener("dispose",s),a[d.id]=!0,r.memory.geometries++),d}function l(u){let d=u.attributes;for(let f in d)t.update(d[f],e.ARRAY_BUFFER)}function h(u){let d=[],f=u.index,x=u.attributes.position,_=0;if(f!==null){let b=f.array;_=f.version;for(let M=0,T=b.length;M<T;M+=3){let D=b[M+0],w=b[M+1],A=b[M+2];d.push(D,w,w,A,A,D)}}else if(x!==void 0){let b=x.array;_=x.version;for(let M=0,T=b.length/3-1;M<T;M+=3){let D=M+0,w=M+1,A=M+2;d.push(D,w,w,A,A,D)}}else return;let m=new(Ws(d)?so:no)(d,1);m.version=_;let p=n.get(u);p&&t.remove(p),n.set(u,m)}function c(u){let d=n.get(u);if(d){let f=u.index;f!==null&&d.version<f.version&&h(u)}else h(u);return n.get(u)}return{get:o,update:l,getWireframeAttribute:c}}function Hp(e,t,r){let i;function a(d){i=d}let n,s;function o(d){n=d.type,s=d.bytesPerElement}function l(d,f){e.drawElements(i,f,n,d*s),r.update(f,i,1)}function h(d,f,x){x!==0&&(e.drawElementsInstanced(i,f,n,d*s,x),r.update(f,i,x))}function c(d,f,x){if(x===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,f,0,n,d,0,x);let _=0;for(let m=0;m<x;m++)_+=f[m];r.update(_,i,1)}function u(d,f,x,_){if(x===0)return;let m=t.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<d.length;p++)h(d[p]/s,f[p],_[p]);else{m.multiDrawElementsInstancedWEBGL(i,f,0,n,d,0,_,0,x);let p=0;for(let b=0;b<x;b++)p+=f[b]*_[b];r.update(p,i,1)}}this.setMode=a,this.setIndex=o,this.render=l,this.renderInstances=h,this.renderMultiDraw=c,this.renderMultiDrawInstances=u}function Vp(e){let t={geometries:0,textures:0},r={frame:0,calls:0,triangles:0,points:0,lines:0};function i(n,s,o){switch(r.calls++,s){case e.TRIANGLES:r.triangles+=o*(n/3);break;case e.LINES:r.lines+=o*(n/2);break;case e.LINE_STRIP:r.lines+=o*(n-1);break;case e.LINE_LOOP:r.lines+=o*n;break;case e.POINTS:r.points+=o*n;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",s);break}}function a(){r.calls=0,r.triangles=0,r.points=0,r.lines=0}return{memory:t,render:r,programs:null,autoReset:!0,reset:a,update:i}}function Gp(e,t,r){let i=new WeakMap,a=new ot;function n(s,o,l){let h=s.morphTargetInfluences,c=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=c!==void 0?c.length:0,d=i.get(o);if(d===void 0||d.count!==u){let f=function(){O.dispose(),i.delete(o),o.removeEventListener("dispose",f)};d!==void 0&&d.texture.dispose();let x=o.morphAttributes.position!==void 0,_=o.morphAttributes.normal!==void 0,m=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],b=o.morphAttributes.normal||[],M=o.morphAttributes.color||[],T=0;x===!0&&(T=1),_===!0&&(T=2),m===!0&&(T=3);let D=o.attributes.position.count*T,w=1;D>t.maxTextureSize&&(w=Math.ceil(D/t.maxTextureSize),D=t.maxTextureSize);let A=new Float32Array(D*w*4*u),O=new Ys(A,D,w,u);O.type=$t,O.needsUpdate=!0;let E=T*4;for(let y=0;y<u;y++){let U=p[y],V=b[y],B=M[y],X=D*w*4*y;for(let Y=0;Y<U.count;Y++){let k=Y*E;x===!0&&(a.fromBufferAttribute(U,Y),A[X+k+0]=a.x,A[X+k+1]=a.y,A[X+k+2]=a.z,A[X+k+3]=0),_===!0&&(a.fromBufferAttribute(V,Y),A[X+k+4]=a.x,A[X+k+5]=a.y,A[X+k+6]=a.z,A[X+k+7]=0),m===!0&&(a.fromBufferAttribute(B,Y),A[X+k+8]=a.x,A[X+k+9]=a.y,A[X+k+10]=a.z,A[X+k+11]=B.itemSize===4?a.w:1)}}d={count:u,texture:O,size:new we(D,w)},i.set(o,d),o.addEventListener("dispose",f)}if(s.isInstancedMesh===!0&&s.morphTexture!==null)l.getUniforms().setValue(e,"morphTexture",s.morphTexture,r);else{let f=0;for(let _=0;_<h.length;_++)f+=h[_];let x=o.morphTargetsRelative?1:1-f;l.getUniforms().setValue(e,"morphTargetBaseInfluence",x),l.getUniforms().setValue(e,"morphTargetInfluences",h)}l.getUniforms().setValue(e,"morphTargetsTexture",d.texture,r),l.getUniforms().setValue(e,"morphTargetsTextureSize",d.size)}return{update:n}}function kp(e,t,r,i){let a=new WeakMap;function n(l){let h=i.render.frame,c=l.geometry,u=t.get(l,c);if(a.get(u)!==h&&(t.update(u),a.set(u,h)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),a.get(l)!==h&&(r.update(l.instanceMatrix,e.ARRAY_BUFFER),l.instanceColor!==null&&r.update(l.instanceColor,e.ARRAY_BUFFER),a.set(l,h))),l.isSkinnedMesh){let d=l.skeleton;a.get(d)!==h&&(d.update(),a.set(d,h))}return u}function s(){a=new WeakMap}function o(l){let h=l.target;h.removeEventListener("dispose",o),r.remove(h.instanceMatrix),h.instanceColor!==null&&r.remove(h.instanceColor)}return{update:n,dispose:s}}var No=new It,Oo=new _o(1,1),Fo=new Ys,Bo=new Lh,zo=new mo,Ho=[],Vo=[],Go=new Float32Array(16),ko=new Float32Array(9),Wo=new Float32Array(4);function li(e,t,r){let i=e[0];if(i<=0||i>0)return e;let a=t*r,n=Ho[a];if(n===void 0&&(n=new Float32Array(a),Ho[a]=n),t!==0){i.toArray(n,0);for(let s=1,o=0;s!==t;++s)o+=r,e[s].toArray(n,o)}return n}function ct(e,t){if(e.length!==t.length)return!1;for(let r=0,i=e.length;r<i;r++)if(e[r]!==t[r])return!1;return!0}function ut(e,t){for(let r=0,i=t.length;r<i;r++)e[r]=t[r]}function xa(e,t){let r=Vo[t];r===void 0&&(r=new Int32Array(t),Vo[t]=r);for(let i=0;i!==t;++i)r[i]=e.allocateTextureUnit();return r}function Wp(e,t){let r=this.cache;r[0]!==t&&(e.uniform1f(this.addr,t),r[0]=t)}function Xp(e,t){let r=this.cache;if(t.x!==void 0)(r[0]!==t.x||r[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),r[0]=t.x,r[1]=t.y);else{if(ct(r,t))return;e.uniform2fv(this.addr,t),ut(r,t)}}function jp(e,t){let r=this.cache;if(t.x!==void 0)(r[0]!==t.x||r[1]!==t.y||r[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),r[0]=t.x,r[1]=t.y,r[2]=t.z);else if(t.r!==void 0)(r[0]!==t.r||r[1]!==t.g||r[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),r[0]=t.r,r[1]=t.g,r[2]=t.b);else{if(ct(r,t))return;e.uniform3fv(this.addr,t),ut(r,t)}}function qp(e,t){let r=this.cache;if(t.x!==void 0)(r[0]!==t.x||r[1]!==t.y||r[2]!==t.z||r[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),r[0]=t.x,r[1]=t.y,r[2]=t.z,r[3]=t.w);else{if(ct(r,t))return;e.uniform4fv(this.addr,t),ut(r,t)}}function Yp(e,t){let r=this.cache,i=t.elements;if(i===void 0){if(ct(r,t))return;e.uniformMatrix2fv(this.addr,!1,t),ut(r,t)}else{if(ct(r,i))return;Wo.set(i),e.uniformMatrix2fv(this.addr,!1,Wo),ut(r,i)}}function Zp(e,t){let r=this.cache,i=t.elements;if(i===void 0){if(ct(r,t))return;e.uniformMatrix3fv(this.addr,!1,t),ut(r,t)}else{if(ct(r,i))return;ko.set(i),e.uniformMatrix3fv(this.addr,!1,ko),ut(r,i)}}function Kp(e,t){let r=this.cache,i=t.elements;if(i===void 0){if(ct(r,t))return;e.uniformMatrix4fv(this.addr,!1,t),ut(r,t)}else{if(ct(r,i))return;Go.set(i),e.uniformMatrix4fv(this.addr,!1,Go),ut(r,i)}}function Jp(e,t){let r=this.cache;r[0]!==t&&(e.uniform1i(this.addr,t),r[0]=t)}function $p(e,t){let r=this.cache;if(t.x!==void 0)(r[0]!==t.x||r[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),r[0]=t.x,r[1]=t.y);else{if(ct(r,t))return;e.uniform2iv(this.addr,t),ut(r,t)}}function Qp(e,t){let r=this.cache;if(t.x!==void 0)(r[0]!==t.x||r[1]!==t.y||r[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),r[0]=t.x,r[1]=t.y,r[2]=t.z);else{if(ct(r,t))return;e.uniform3iv(this.addr,t),ut(r,t)}}function ef(e,t){let r=this.cache;if(t.x!==void 0)(r[0]!==t.x||r[1]!==t.y||r[2]!==t.z||r[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),r[0]=t.x,r[1]=t.y,r[2]=t.z,r[3]=t.w);else{if(ct(r,t))return;e.uniform4iv(this.addr,t),ut(r,t)}}function tf(e,t){let r=this.cache;r[0]!==t&&(e.uniform1ui(this.addr,t),r[0]=t)}function rf(e,t){let r=this.cache;if(t.x!==void 0)(r[0]!==t.x||r[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),r[0]=t.x,r[1]=t.y);else{if(ct(r,t))return;e.uniform2uiv(this.addr,t),ut(r,t)}}function af(e,t){let r=this.cache;if(t.x!==void 0)(r[0]!==t.x||r[1]!==t.y||r[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),r[0]=t.x,r[1]=t.y,r[2]=t.z);else{if(ct(r,t))return;e.uniform3uiv(this.addr,t),ut(r,t)}}function nf(e,t){let r=this.cache;if(t.x!==void 0)(r[0]!==t.x||r[1]!==t.y||r[2]!==t.z||r[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),r[0]=t.x,r[1]=t.y,r[2]=t.z,r[3]=t.w);else{if(ct(r,t))return;e.uniform4uiv(this.addr,t),ut(r,t)}}function sf(e,t,r){let i=this.cache,a=r.allocateTextureUnit();i[0]!==a&&(e.uniform1i(this.addr,a),i[0]=a);let n;this.type===e.SAMPLER_2D_SHADOW?(Oo.compareFunction=zs,n=Oo):n=No,r.setTexture2D(t||n,a)}function of(e,t,r){let i=this.cache,a=r.allocateTextureUnit();i[0]!==a&&(e.uniform1i(this.addr,a),i[0]=a),r.setTexture3D(t||Bo,a)}function lf(e,t,r){let i=this.cache,a=r.allocateTextureUnit();i[0]!==a&&(e.uniform1i(this.addr,a),i[0]=a),r.setTextureCube(t||zo,a)}function hf(e,t,r){let i=this.cache,a=r.allocateTextureUnit();i[0]!==a&&(e.uniform1i(this.addr,a),i[0]=a),r.setTexture2DArray(t||Fo,a)}function cf(e){switch(e){case 5126:return Wp;case 35664:return Xp;case 35665:return jp;case 35666:return qp;case 35674:return Yp;case 35675:return Zp;case 35676:return Kp;case 5124:case 35670:return Jp;case 35667:case 35671:return $p;case 35668:case 35672:return Qp;case 35669:case 35673:return ef;case 5125:return tf;case 36294:return rf;case 36295:return af;case 36296:return nf;case 35678:case 36198:case 36298:case 36306:case 35682:return sf;case 35679:case 36299:case 36307:return of;case 35680:case 36300:case 36308:case 36293:return lf;case 36289:case 36303:case 36311:case 36292:return hf}}function uf(e,t){e.uniform1fv(this.addr,t)}function df(e,t){let r=li(t,this.size,2);e.uniform2fv(this.addr,r)}function pf(e,t){let r=li(t,this.size,3);e.uniform3fv(this.addr,r)}function ff(e,t){let r=li(t,this.size,4);e.uniform4fv(this.addr,r)}function mf(e,t){let r=li(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,r)}function gf(e,t){let r=li(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,r)}function _f(e,t){let r=li(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,r)}function vf(e,t){e.uniform1iv(this.addr,t)}function xf(e,t){e.uniform2iv(this.addr,t)}function yf(e,t){e.uniform3iv(this.addr,t)}function Mf(e,t){e.uniform4iv(this.addr,t)}function Sf(e,t){e.uniform1uiv(this.addr,t)}function Ef(e,t){e.uniform2uiv(this.addr,t)}function Tf(e,t){e.uniform3uiv(this.addr,t)}function bf(e,t){e.uniform4uiv(this.addr,t)}function wf(e,t,r){let i=this.cache,a=t.length,n=xa(r,a);ct(i,n)||(e.uniform1iv(this.addr,n),ut(i,n));for(let s=0;s!==a;++s)r.setTexture2D(t[s]||No,n[s])}function Af(e,t,r){let i=this.cache,a=t.length,n=xa(r,a);ct(i,n)||(e.uniform1iv(this.addr,n),ut(i,n));for(let s=0;s!==a;++s)r.setTexture3D(t[s]||Bo,n[s])}function Rf(e,t,r){let i=this.cache,a=t.length,n=xa(r,a);ct(i,n)||(e.uniform1iv(this.addr,n),ut(i,n));for(let s=0;s!==a;++s)r.setTextureCube(t[s]||zo,n[s])}function Cf(e,t,r){let i=this.cache,a=t.length,n=xa(r,a);ct(i,n)||(e.uniform1iv(this.addr,n),ut(i,n));for(let s=0;s!==a;++s)r.setTexture2DArray(t[s]||Fo,n[s])}function Pf(e){switch(e){case 5126:return uf;case 35664:return df;case 35665:return pf;case 35666:return ff;case 35674:return mf;case 35675:return gf;case 35676:return _f;case 5124:case 35670:return vf;case 35667:case 35671:return xf;case 35668:case 35672:return yf;case 35669:case 35673:return Mf;case 5125:return Sf;case 36294:return Ef;case 36295:return Tf;case 36296:return bf;case 35678:case 36198:case 36298:case 36306:case 35682:return wf;case 35679:case 36299:case 36307:return Af;case 35680:case 36300:case 36308:case 36293:return Rf;case 36289:case 36303:case 36311:case 36292:return Cf}}var Uf=class{constructor(e,t,r){this.id=e,this.addr=r,this.cache=[],this.type=t.type,this.setValue=cf(t.type)}},Lf=class{constructor(e,t,r){this.id=e,this.addr=r,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Pf(t.type)}},Df=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,r){let i=this.seq;for(let a=0,n=i.length;a!==n;++a){let s=i[a];s.setValue(e,t[s.id],r)}}},us=/(\w+)(\])?(\[|\.)?/g;function Xo(e,t){e.seq.push(t),e.map[t.id]=t}function If(e,t,r){let i=e.name,a=i.length;for(us.lastIndex=0;;){let n=us.exec(i),s=us.lastIndex,o=n[1],l=n[2]==="]",h=n[3];if(l&&(o=o|0),h===void 0||h==="["&&s+2===a){Xo(r,h===void 0?new Uf(o,e,t):new Lf(o,e,t));break}else{let c=r.map[o];c===void 0&&(c=new Df(o),Xo(r,c)),r=c}}}var ya=class{constructor(e,t){this.seq=[],this.map={};let r=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let i=0;i<r;++i){let a=e.getActiveUniform(t,i),n=e.getUniformLocation(t,a.name);If(a,n,this)}}setValue(e,t,r,i){let a=this.map[t];a!==void 0&&a.setValue(e,r,i)}setOptional(e,t,r){let i=t[r];i!==void 0&&this.setValue(e,r,i)}static upload(e,t,r,i){for(let a=0,n=t.length;a!==n;++a){let s=t[a],o=r[s.id];o.needsUpdate!==!1&&s.setValue(e,o.value,i)}}static seqWithValue(e,t){let r=[];for(let i=0,a=e.length;i!==a;++i){let n=e[i];n.id in t&&r.push(n)}return r}};function jo(e,t,r){let i=e.createShader(t);return e.shaderSource(i,r),e.compileShader(i),i}var Nf=37297,Of=0;function Ff(e,t){let r=e.split(`
`),i=[],a=Math.max(t-6,0),n=Math.min(t+6,r.length);for(let s=a;s<n;s++){let o=s+1;i.push(`${o===t?">":" "} ${o}: ${r[s]}`)}return i.join(`
`)}var qo=new He;function Bf(e){Xe._getMatrix(qo,Xe.workingColorSpace,e);let t=`mat3( ${qo.elements.map(r=>r.toFixed(4))} )`;switch(Xe.getTransfer(e)){case Wi:return[t,"LinearTransferOETF"];case Ye:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",e),[t,"LinearTransferOETF"]}}function Yo(e,t,r){let i=e.getShaderParameter(t,e.COMPILE_STATUS),a=(e.getShaderInfoLog(t)||"").trim();if(i&&a==="")return"";let n=/ERROR: 0:(\d+)/.exec(a);if(n){let s=parseInt(n[1]);return r.toUpperCase()+`

`+a+`

`+Ff(e.getShaderSource(t),s)}else return a}function zf(e,t){let r=Bf(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${r[1]}( vec4( value.rgb * ${r[0]}, value.a ) );`,"}"].join(`
`)}function Hf(e,t){let r;switch(t){case jl:r="Linear";break;case ql:r="Reinhard";break;case Yl:r="Cineon";break;case Ts:r="ACESFilmic";break;case Kl:r="AgX";break;case Jl:r="Neutral";break;case Zl:r="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),r="Linear"}return"vec3 "+e+"( vec3 color ) { return "+r+"ToneMapping( color ); }"}var Ma=new L;function Vf(){Xe.getLuminanceCoefficients(Ma);let e=Ma.x.toFixed(4),t=Ma.y.toFixed(4),r=Ma.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${t}, ${r} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Gf(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Li).join(`
`)}function kf(e){let t=[];for(let r in e){let i=e[r];i!==!1&&t.push("#define "+r+" "+i)}return t.join(`
`)}function Wf(e,t){let r={},i=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let a=0;a<i;a++){let n=e.getActiveAttrib(t,a),s=n.name,o=1;n.type===e.FLOAT_MAT2&&(o=2),n.type===e.FLOAT_MAT3&&(o=3),n.type===e.FLOAT_MAT4&&(o=4),r[s]={type:n.type,location:e.getAttribLocation(t,s),locationSize:o}}return r}function Li(e){return e!==""}function Zo(e,t){let r=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,r).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Ko(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Xf=/^[ \t]*#include +<([\w\d./]+)>/gm;function ds(e){return e.replace(Xf,qf)}var jf=new Map;function qf(e,t){let r=Be[t];if(r===void 0){let i=jf.get(t);if(i!==void 0)r=Be[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("Can not resolve #include <"+t+">")}return ds(r)}var Yf=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Jo(e){return e.replace(Yf,Zf)}function Zf(e,t,r,i){let a="";for(let n=parseInt(t);n<parseInt(r);n++)a+=i.replace(/\[\s*i\s*\]/g,"[ "+n+" ]").replace(/UNROLLED_LOOP_INDEX/g,n);return a}function $o(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision==="highp"?t+=`
#define HIGH_PRECISION`:e.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:e.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function Kf(e){let t="SHADOWMAP_TYPE_BASIC";return e.shadowMapType===ys?t="SHADOWMAP_TYPE_PCF":e.shadowMapType===bl?t="SHADOWMAP_TYPE_PCF_SOFT":e.shadowMapType===Kt&&(t="SHADOWMAP_TYPE_VSM"),t}function Jf(e){let t="ENVMAP_TYPE_CUBE";if(e.envMap)switch(e.envMapMode){case Fr:case Br:t="ENVMAP_TYPE_CUBE";break;case Ni:t="ENVMAP_TYPE_CUBE_UV";break}return t}function $f(e){let t="ENVMAP_MODE_REFLECTION";return e.envMap&&e.envMapMode===Br&&(t="ENVMAP_MODE_REFRACTION"),t}function Qf(e){let t="ENVMAP_BLENDING_NONE";if(e.envMap)switch(e.combine){case Es:t="ENVMAP_BLENDING_MULTIPLY";break;case Wl:t="ENVMAP_BLENDING_MIX";break;case Xl:t="ENVMAP_BLENDING_ADD";break}return t}function em(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let r=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,r),112)),texelHeight:i,maxMip:r}}function tm(e,t,r,i){let a=e.getContext(),n=r.defines,s=r.vertexShader,o=r.fragmentShader,l=Kf(r),h=Jf(r),c=$f(r),u=Qf(r),d=em(r),f=Gf(r),x=kf(n),_=a.createProgram(),m,p,b=r.glslVersion?"#version "+r.glslVersion+`
`:"";r.isRawShaderMaterial?(m=["#define SHADER_TYPE "+r.shaderType,"#define SHADER_NAME "+r.shaderName,x].filter(Li).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+r.shaderType,"#define SHADER_NAME "+r.shaderName,x].filter(Li).join(`
`),p.length>0&&(p+=`
`)):(m=[$o(r),"#define SHADER_TYPE "+r.shaderType,"#define SHADER_NAME "+r.shaderName,x,r.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",r.batching?"#define USE_BATCHING":"",r.batchingColor?"#define USE_BATCHING_COLOR":"",r.instancing?"#define USE_INSTANCING":"",r.instancingColor?"#define USE_INSTANCING_COLOR":"",r.instancingMorph?"#define USE_INSTANCING_MORPH":"",r.useFog&&r.fog?"#define USE_FOG":"",r.useFog&&r.fogExp2?"#define FOG_EXP2":"",r.map?"#define USE_MAP":"",r.envMap?"#define USE_ENVMAP":"",r.envMap?"#define "+c:"",r.lightMap?"#define USE_LIGHTMAP":"",r.aoMap?"#define USE_AOMAP":"",r.bumpMap?"#define USE_BUMPMAP":"",r.normalMap?"#define USE_NORMALMAP":"",r.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",r.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",r.displacementMap?"#define USE_DISPLACEMENTMAP":"",r.emissiveMap?"#define USE_EMISSIVEMAP":"",r.anisotropy?"#define USE_ANISOTROPY":"",r.anisotropyMap?"#define USE_ANISOTROPYMAP":"",r.clearcoatMap?"#define USE_CLEARCOATMAP":"",r.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",r.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",r.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",r.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",r.specularMap?"#define USE_SPECULARMAP":"",r.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",r.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",r.roughnessMap?"#define USE_ROUGHNESSMAP":"",r.metalnessMap?"#define USE_METALNESSMAP":"",r.alphaMap?"#define USE_ALPHAMAP":"",r.alphaHash?"#define USE_ALPHAHASH":"",r.transmission?"#define USE_TRANSMISSION":"",r.transmissionMap?"#define USE_TRANSMISSIONMAP":"",r.thicknessMap?"#define USE_THICKNESSMAP":"",r.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",r.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",r.mapUv?"#define MAP_UV "+r.mapUv:"",r.alphaMapUv?"#define ALPHAMAP_UV "+r.alphaMapUv:"",r.lightMapUv?"#define LIGHTMAP_UV "+r.lightMapUv:"",r.aoMapUv?"#define AOMAP_UV "+r.aoMapUv:"",r.emissiveMapUv?"#define EMISSIVEMAP_UV "+r.emissiveMapUv:"",r.bumpMapUv?"#define BUMPMAP_UV "+r.bumpMapUv:"",r.normalMapUv?"#define NORMALMAP_UV "+r.normalMapUv:"",r.displacementMapUv?"#define DISPLACEMENTMAP_UV "+r.displacementMapUv:"",r.metalnessMapUv?"#define METALNESSMAP_UV "+r.metalnessMapUv:"",r.roughnessMapUv?"#define ROUGHNESSMAP_UV "+r.roughnessMapUv:"",r.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+r.anisotropyMapUv:"",r.clearcoatMapUv?"#define CLEARCOATMAP_UV "+r.clearcoatMapUv:"",r.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+r.clearcoatNormalMapUv:"",r.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+r.clearcoatRoughnessMapUv:"",r.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+r.iridescenceMapUv:"",r.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+r.iridescenceThicknessMapUv:"",r.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+r.sheenColorMapUv:"",r.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+r.sheenRoughnessMapUv:"",r.specularMapUv?"#define SPECULARMAP_UV "+r.specularMapUv:"",r.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+r.specularColorMapUv:"",r.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+r.specularIntensityMapUv:"",r.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+r.transmissionMapUv:"",r.thicknessMapUv?"#define THICKNESSMAP_UV "+r.thicknessMapUv:"",r.vertexTangents&&r.flatShading===!1?"#define USE_TANGENT":"",r.vertexColors?"#define USE_COLOR":"",r.vertexAlphas?"#define USE_COLOR_ALPHA":"",r.vertexUv1s?"#define USE_UV1":"",r.vertexUv2s?"#define USE_UV2":"",r.vertexUv3s?"#define USE_UV3":"",r.pointsUvs?"#define USE_POINTS_UV":"",r.flatShading?"#define FLAT_SHADED":"",r.skinning?"#define USE_SKINNING":"",r.morphTargets?"#define USE_MORPHTARGETS":"",r.morphNormals&&r.flatShading===!1?"#define USE_MORPHNORMALS":"",r.morphColors?"#define USE_MORPHCOLORS":"",r.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+r.morphTextureStride:"",r.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+r.morphTargetsCount:"",r.doubleSided?"#define DOUBLE_SIDED":"",r.flipSided?"#define FLIP_SIDED":"",r.shadowMapEnabled?"#define USE_SHADOWMAP":"",r.shadowMapEnabled?"#define "+l:"",r.sizeAttenuation?"#define USE_SIZEATTENUATION":"",r.numLightProbes>0?"#define USE_LIGHT_PROBES":"",r.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",r.reversedDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Li).join(`
`),p=[$o(r),"#define SHADER_TYPE "+r.shaderType,"#define SHADER_NAME "+r.shaderName,x,r.useFog&&r.fog?"#define USE_FOG":"",r.useFog&&r.fogExp2?"#define FOG_EXP2":"",r.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",r.map?"#define USE_MAP":"",r.matcap?"#define USE_MATCAP":"",r.envMap?"#define USE_ENVMAP":"",r.envMap?"#define "+h:"",r.envMap?"#define "+c:"",r.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",r.lightMap?"#define USE_LIGHTMAP":"",r.aoMap?"#define USE_AOMAP":"",r.bumpMap?"#define USE_BUMPMAP":"",r.normalMap?"#define USE_NORMALMAP":"",r.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",r.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",r.emissiveMap?"#define USE_EMISSIVEMAP":"",r.anisotropy?"#define USE_ANISOTROPY":"",r.anisotropyMap?"#define USE_ANISOTROPYMAP":"",r.clearcoat?"#define USE_CLEARCOAT":"",r.clearcoatMap?"#define USE_CLEARCOATMAP":"",r.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",r.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",r.dispersion?"#define USE_DISPERSION":"",r.iridescence?"#define USE_IRIDESCENCE":"",r.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",r.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",r.specularMap?"#define USE_SPECULARMAP":"",r.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",r.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",r.roughnessMap?"#define USE_ROUGHNESSMAP":"",r.metalnessMap?"#define USE_METALNESSMAP":"",r.alphaMap?"#define USE_ALPHAMAP":"",r.alphaTest?"#define USE_ALPHATEST":"",r.alphaHash?"#define USE_ALPHAHASH":"",r.sheen?"#define USE_SHEEN":"",r.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",r.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",r.transmission?"#define USE_TRANSMISSION":"",r.transmissionMap?"#define USE_TRANSMISSIONMAP":"",r.thicknessMap?"#define USE_THICKNESSMAP":"",r.vertexTangents&&r.flatShading===!1?"#define USE_TANGENT":"",r.vertexColors||r.instancingColor||r.batchingColor?"#define USE_COLOR":"",r.vertexAlphas?"#define USE_COLOR_ALPHA":"",r.vertexUv1s?"#define USE_UV1":"",r.vertexUv2s?"#define USE_UV2":"",r.vertexUv3s?"#define USE_UV3":"",r.pointsUvs?"#define USE_POINTS_UV":"",r.gradientMap?"#define USE_GRADIENTMAP":"",r.flatShading?"#define FLAT_SHADED":"",r.doubleSided?"#define DOUBLE_SIDED":"",r.flipSided?"#define FLIP_SIDED":"",r.shadowMapEnabled?"#define USE_SHADOWMAP":"",r.shadowMapEnabled?"#define "+l:"",r.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",r.numLightProbes>0?"#define USE_LIGHT_PROBES":"",r.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",r.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",r.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",r.reversedDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",r.toneMapping!==hr?"#define TONE_MAPPING":"",r.toneMapping!==hr?Be.tonemapping_pars_fragment:"",r.toneMapping!==hr?Hf("toneMapping",r.toneMapping):"",r.dithering?"#define DITHERING":"",r.opaque?"#define OPAQUE":"",Be.colorspace_pars_fragment,zf("linearToOutputTexel",r.outputColorSpace),Vf(),r.useDepthPacking?"#define DEPTH_PACKING "+r.depthPacking:"",`
`].filter(Li).join(`
`)),s=ds(s),s=Zo(s,r),s=Ko(s,r),o=ds(o),o=Zo(o,r),o=Ko(o,r),s=Jo(s),o=Jo(o),r.isRawShaderMaterial!==!0&&(b=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",r.glslVersion===Vs?"":"layout(location = 0) out highp vec4 pc_fragColor;",r.glslVersion===Vs?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let M=b+m+s,T=b+p+o,D=jo(a,a.VERTEX_SHADER,M),w=jo(a,a.FRAGMENT_SHADER,T);a.attachShader(_,D),a.attachShader(_,w),r.index0AttributeName!==void 0?a.bindAttribLocation(_,0,r.index0AttributeName):r.morphTargets===!0&&a.bindAttribLocation(_,0,"position"),a.linkProgram(_);function A(U){if(e.debug.checkShaderErrors){let V=a.getProgramInfoLog(_)||"",B=a.getShaderInfoLog(D)||"",X=a.getShaderInfoLog(w)||"",Y=V.trim(),k=B.trim(),$=X.trim(),q=!0,K=!0;if(a.getProgramParameter(_,a.LINK_STATUS)===!1)if(q=!1,typeof e.debug.onShaderError=="function")e.debug.onShaderError(a,_,D,w);else{let me=Yo(a,D,"vertex"),De=Yo(a,w,"fragment");console.error("THREE.WebGLProgram: Shader Error "+a.getError()+" - VALIDATE_STATUS "+a.getProgramParameter(_,a.VALIDATE_STATUS)+`

Material Name: `+U.name+`
Material Type: `+U.type+`

Program Info Log: `+Y+`
`+me+`
`+De)}else Y!==""?console.warn("THREE.WebGLProgram: Program Info Log:",Y):(k===""||$==="")&&(K=!1);K&&(U.diagnostics={runnable:q,programLog:Y,vertexShader:{log:k,prefix:m},fragmentShader:{log:$,prefix:p}})}a.deleteShader(D),a.deleteShader(w),O=new ya(a,_),E=Wf(a,_)}let O;this.getUniforms=function(){return O===void 0&&A(this),O};let E;this.getAttributes=function(){return E===void 0&&A(this),E};let y=r.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return y===!1&&(y=a.getProgramParameter(_,Nf)),y},this.destroy=function(){i.releaseStatesOfProgram(this),a.deleteProgram(_),this.program=void 0},this.type=r.shaderType,this.name=r.shaderName,this.id=Of++,this.cacheKey=t,this.usedTimes=1,this.program=_,this.vertexShader=D,this.fragmentShader=w,this}var rm=0,im=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,r=e.fragmentShader,i=this._getShaderStage(t),a=this._getShaderStage(r),n=this._getShaderCacheForMaterial(e);return n.has(i)===!1&&(n.add(i),i.usedTimes++),n.has(a)===!1&&(n.add(a),a.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let r of t)r.usedTimes--,r.usedTimes===0&&this.shaderCache.delete(r.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,r=t.get(e);return r===void 0&&(r=new Set,t.set(e,r)),r}_getShaderStage(e){let t=this.shaderCache,r=t.get(e);return r===void 0&&(r=new am(e),t.set(e,r)),r}},am=class{constructor(e){this.id=rm++,this.code=e,this.usedTimes=0}};function nm(e,t,r,i,a,n,s){let o=new Js,l=new im,h=new Set,c=[],u=a.logarithmicDepthBuffer,d=a.vertexTextures,f=a.precision,x={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(E){return h.add(E),E===0?"uv":`uv${E}`}function m(E,y,U,V,B){let X=V.fog,Y=B.geometry,k=E.isMeshStandardMaterial?V.environment:null,$=(E.isMeshStandardMaterial?r:t).get(E.envMap||k),q=$&&$.mapping===Ni?$.image.height:null,K=x[E.type];E.precision!==null&&(f=a.getMaxPrecision(E.precision),f!==E.precision&&console.warn("THREE.WebGLProgram.getParameters:",E.precision,"not supported, using",f,"instead."));let me=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,De=me!==void 0?me.length:0,Pe=0;Y.morphAttributes.position!==void 0&&(Pe=1),Y.morphAttributes.normal!==void 0&&(Pe=2),Y.morphAttributes.color!==void 0&&(Pe=3);let Fe,j,re,ye;if(K){let qe=Yt[K];Fe=qe.vertexShader,j=qe.fragmentShader}else Fe=E.vertexShader,j=E.fragmentShader,l.update(E),re=l.getVertexShaderID(E),ye=l.getFragmentShaderID(E);let de=e.getRenderTarget(),he=e.state.buffers.depth.getReversed(),Re=B.isInstancedMesh===!0,Ne=B.isBatchedMesh===!0,je=!!E.map,R=!!E.matcap,it=!!$,Ve=!!E.aoMap,Ge=!!E.lightMap,pe=!!E.bumpMap,Ze=!!E.normalMap,Ee=!!E.displacementMap,Ae=!!E.emissiveMap,nt=!!E.metalnessMap,at=!!E.roughnessMap,ne=E.anisotropy>0,S=E.clearcoat>0,g=E.dispersion>0,P=E.iridescence>0,z=E.sheen>0,W=E.transmission>0,F=ne&&!!E.anisotropyMap,ce=S&&!!E.clearcoatMap,te=S&&!!E.clearcoatNormalMap,ge=S&&!!E.clearcoatRoughnessMap,Te=P&&!!E.iridescenceMap,Q=P&&!!E.iridescenceThicknessMap,oe=z&&!!E.sheenColorMap,ie=z&&!!E.sheenRoughnessMap,Me=!!E.specularMap,ue=!!E.specularColorMap,Oe=!!E.specularIntensityMap,C=W&&!!E.transmissionMap,le=W&&!!E.thicknessMap,ae=!!E.gradientMap,Se=!!E.alphaMap,ee=E.alphaTest>0,Z=!!E.alphaHash,xe=!!E.extensions,Ce=hr;E.toneMapped&&(de===null||de.isXRRenderTarget===!0)&&(Ce=e.toneMapping);let st={shaderID:K,shaderType:E.type,shaderName:E.name,vertexShader:Fe,fragmentShader:j,defines:E.defines,customVertexShaderID:re,customFragmentShaderID:ye,isRawShaderMaterial:E.isRawShaderMaterial===!0,glslVersion:E.glslVersion,precision:f,batching:Ne,batchingColor:Ne&&B._colorsTexture!==null,instancing:Re,instancingColor:Re&&B.instanceColor!==null,instancingMorph:Re&&B.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:de===null?e.outputColorSpace:de.isXRRenderTarget===!0?de.texture.colorSpace:zr,alphaToCoverage:!!E.alphaToCoverage,map:je,matcap:R,envMap:it,envMapMode:it&&$.mapping,envMapCubeUVHeight:q,aoMap:Ve,lightMap:Ge,bumpMap:pe,normalMap:Ze,displacementMap:d&&Ee,emissiveMap:Ae,normalMapObjectSpace:Ze&&E.normalMapType===th,normalMapTangentSpace:Ze&&E.normalMapType===Fs,metalnessMap:nt,roughnessMap:at,anisotropy:ne,anisotropyMap:F,clearcoat:S,clearcoatMap:ce,clearcoatNormalMap:te,clearcoatRoughnessMap:ge,dispersion:g,iridescence:P,iridescenceMap:Te,iridescenceThicknessMap:Q,sheen:z,sheenColorMap:oe,sheenRoughnessMap:ie,specularMap:Me,specularColorMap:ue,specularIntensityMap:Oe,transmission:W,transmissionMap:C,thicknessMap:le,gradientMap:ae,opaque:E.transparent===!1&&E.blending===Nr&&E.alphaToCoverage===!1,alphaMap:Se,alphaTest:ee,alphaHash:Z,combine:E.combine,mapUv:je&&_(E.map.channel),aoMapUv:Ve&&_(E.aoMap.channel),lightMapUv:Ge&&_(E.lightMap.channel),bumpMapUv:pe&&_(E.bumpMap.channel),normalMapUv:Ze&&_(E.normalMap.channel),displacementMapUv:Ee&&_(E.displacementMap.channel),emissiveMapUv:Ae&&_(E.emissiveMap.channel),metalnessMapUv:nt&&_(E.metalnessMap.channel),roughnessMapUv:at&&_(E.roughnessMap.channel),anisotropyMapUv:F&&_(E.anisotropyMap.channel),clearcoatMapUv:ce&&_(E.clearcoatMap.channel),clearcoatNormalMapUv:te&&_(E.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ge&&_(E.clearcoatRoughnessMap.channel),iridescenceMapUv:Te&&_(E.iridescenceMap.channel),iridescenceThicknessMapUv:Q&&_(E.iridescenceThicknessMap.channel),sheenColorMapUv:oe&&_(E.sheenColorMap.channel),sheenRoughnessMapUv:ie&&_(E.sheenRoughnessMap.channel),specularMapUv:Me&&_(E.specularMap.channel),specularColorMapUv:ue&&_(E.specularColorMap.channel),specularIntensityMapUv:Oe&&_(E.specularIntensityMap.channel),transmissionMapUv:C&&_(E.transmissionMap.channel),thicknessMapUv:le&&_(E.thicknessMap.channel),alphaMapUv:Se&&_(E.alphaMap.channel),vertexTangents:!!Y.attributes.tangent&&(Ze||ne),vertexColors:E.vertexColors,vertexAlphas:E.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,pointsUvs:B.isPoints===!0&&!!Y.attributes.uv&&(je||Se),fog:!!X,useFog:E.fog===!0,fogExp2:!!X&&X.isFogExp2,flatShading:E.flatShading===!0&&E.wireframe===!1,sizeAttenuation:E.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:he,skinning:B.isSkinnedMesh===!0,morphTargets:Y.morphAttributes.position!==void 0,morphNormals:Y.morphAttributes.normal!==void 0,morphColors:Y.morphAttributes.color!==void 0,morphTargetsCount:De,morphTextureStride:Pe,numDirLights:y.directional.length,numPointLights:y.point.length,numSpotLights:y.spot.length,numSpotLightMaps:y.spotLightMap.length,numRectAreaLights:y.rectArea.length,numHemiLights:y.hemi.length,numDirLightShadows:y.directionalShadowMap.length,numPointLightShadows:y.pointShadowMap.length,numSpotLightShadows:y.spotShadowMap.length,numSpotLightShadowsWithMaps:y.numSpotLightShadowsWithMaps,numLightProbes:y.numLightProbes,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:E.dithering,shadowMapEnabled:e.shadowMap.enabled&&U.length>0,shadowMapType:e.shadowMap.type,toneMapping:Ce,decodeVideoTexture:je&&E.map.isVideoTexture===!0&&Xe.getTransfer(E.map.colorSpace)===Ye,decodeVideoTextureEmissive:Ae&&E.emissiveMap.isVideoTexture===!0&&Xe.getTransfer(E.emissiveMap.colorSpace)===Ye,premultipliedAlpha:E.premultipliedAlpha,doubleSided:E.side===Jt,flipSided:E.side===xt,useDepthPacking:E.depthPacking>=0,depthPacking:E.depthPacking||0,index0AttributeName:E.index0AttributeName,extensionClipCullDistance:xe&&E.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(xe&&E.extensions.multiDraw===!0||Ne)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:E.customProgramCacheKey()};return st.vertexUv1s=h.has(1),st.vertexUv2s=h.has(2),st.vertexUv3s=h.has(3),h.clear(),st}function p(E){let y=[];if(E.shaderID?y.push(E.shaderID):(y.push(E.customVertexShaderID),y.push(E.customFragmentShaderID)),E.defines!==void 0)for(let U in E.defines)y.push(U),y.push(E.defines[U]);return E.isRawShaderMaterial===!1&&(b(y,E),M(y,E),y.push(e.outputColorSpace)),y.push(E.customProgramCacheKey),y.join()}function b(E,y){E.push(y.precision),E.push(y.outputColorSpace),E.push(y.envMapMode),E.push(y.envMapCubeUVHeight),E.push(y.mapUv),E.push(y.alphaMapUv),E.push(y.lightMapUv),E.push(y.aoMapUv),E.push(y.bumpMapUv),E.push(y.normalMapUv),E.push(y.displacementMapUv),E.push(y.emissiveMapUv),E.push(y.metalnessMapUv),E.push(y.roughnessMapUv),E.push(y.anisotropyMapUv),E.push(y.clearcoatMapUv),E.push(y.clearcoatNormalMapUv),E.push(y.clearcoatRoughnessMapUv),E.push(y.iridescenceMapUv),E.push(y.iridescenceThicknessMapUv),E.push(y.sheenColorMapUv),E.push(y.sheenRoughnessMapUv),E.push(y.specularMapUv),E.push(y.specularColorMapUv),E.push(y.specularIntensityMapUv),E.push(y.transmissionMapUv),E.push(y.thicknessMapUv),E.push(y.combine),E.push(y.fogExp2),E.push(y.sizeAttenuation),E.push(y.morphTargetsCount),E.push(y.morphAttributeCount),E.push(y.numDirLights),E.push(y.numPointLights),E.push(y.numSpotLights),E.push(y.numSpotLightMaps),E.push(y.numHemiLights),E.push(y.numRectAreaLights),E.push(y.numDirLightShadows),E.push(y.numPointLightShadows),E.push(y.numSpotLightShadows),E.push(y.numSpotLightShadowsWithMaps),E.push(y.numLightProbes),E.push(y.shadowMapType),E.push(y.toneMapping),E.push(y.numClippingPlanes),E.push(y.numClipIntersection),E.push(y.depthPacking)}function M(E,y){o.disableAll(),y.supportsVertexTextures&&o.enable(0),y.instancing&&o.enable(1),y.instancingColor&&o.enable(2),y.instancingMorph&&o.enable(3),y.matcap&&o.enable(4),y.envMap&&o.enable(5),y.normalMapObjectSpace&&o.enable(6),y.normalMapTangentSpace&&o.enable(7),y.clearcoat&&o.enable(8),y.iridescence&&o.enable(9),y.alphaTest&&o.enable(10),y.vertexColors&&o.enable(11),y.vertexAlphas&&o.enable(12),y.vertexUv1s&&o.enable(13),y.vertexUv2s&&o.enable(14),y.vertexUv3s&&o.enable(15),y.vertexTangents&&o.enable(16),y.anisotropy&&o.enable(17),y.alphaHash&&o.enable(18),y.batching&&o.enable(19),y.dispersion&&o.enable(20),y.batchingColor&&o.enable(21),y.gradientMap&&o.enable(22),E.push(o.mask),o.disableAll(),y.fog&&o.enable(0),y.useFog&&o.enable(1),y.flatShading&&o.enable(2),y.logarithmicDepthBuffer&&o.enable(3),y.reversedDepthBuffer&&o.enable(4),y.skinning&&o.enable(5),y.morphTargets&&o.enable(6),y.morphNormals&&o.enable(7),y.morphColors&&o.enable(8),y.premultipliedAlpha&&o.enable(9),y.shadowMapEnabled&&o.enable(10),y.doubleSided&&o.enable(11),y.flipSided&&o.enable(12),y.useDepthPacking&&o.enable(13),y.dithering&&o.enable(14),y.transmission&&o.enable(15),y.sheen&&o.enable(16),y.opaque&&o.enable(17),y.pointsUvs&&o.enable(18),y.decodeVideoTexture&&o.enable(19),y.decodeVideoTextureEmissive&&o.enable(20),y.alphaToCoverage&&o.enable(21),E.push(o.mask)}function T(E){let y=x[E.type],U;if(y){let V=Yt[y];U=jh.clone(V.uniforms)}else U=E.uniforms;return U}function D(E,y){let U;for(let V=0,B=c.length;V<B;V++){let X=c[V];if(X.cacheKey===y){U=X,++U.usedTimes;break}}return U===void 0&&(U=new tm(e,y,E,n),c.push(U)),U}function w(E){if(--E.usedTimes===0){let y=c.indexOf(E);c[y]=c[c.length-1],c.pop(),E.destroy()}}function A(E){l.remove(E)}function O(){l.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:T,acquireProgram:D,releaseProgram:w,releaseShaderCache:A,programs:c,dispose:O}}function sm(){let e=new WeakMap;function t(s){return e.has(s)}function r(s){let o=e.get(s);return o===void 0&&(o={},e.set(s,o)),o}function i(s){e.delete(s)}function a(s,o,l){e.get(s)[o]=l}function n(){e=new WeakMap}return{has:t,get:r,remove:i,update:a,dispose:n}}function om(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.material.id!==t.material.id?e.material.id-t.material.id:e.z!==t.z?e.z-t.z:e.id-t.id}function Qo(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.z!==t.z?t.z-e.z:e.id-t.id}function el(){let e=[],t=0,r=[],i=[],a=[];function n(){t=0,r.length=0,i.length=0,a.length=0}function s(u,d,f,x,_,m){let p=e[t];return p===void 0?(p={id:u.id,object:u,geometry:d,material:f,groupOrder:x,renderOrder:u.renderOrder,z:_,group:m},e[t]=p):(p.id=u.id,p.object=u,p.geometry=d,p.material=f,p.groupOrder=x,p.renderOrder=u.renderOrder,p.z=_,p.group=m),t++,p}function o(u,d,f,x,_,m){let p=s(u,d,f,x,_,m);f.transmission>0?i.push(p):f.transparent===!0?a.push(p):r.push(p)}function l(u,d,f,x,_,m){let p=s(u,d,f,x,_,m);f.transmission>0?i.unshift(p):f.transparent===!0?a.unshift(p):r.unshift(p)}function h(u,d){r.length>1&&r.sort(u||om),i.length>1&&i.sort(d||Qo),a.length>1&&a.sort(d||Qo)}function c(){for(let u=t,d=e.length;u<d;u++){let f=e[u];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:r,transmissive:i,transparent:a,init:n,push:o,unshift:l,finish:c,sort:h}}function lm(){let e=new WeakMap;function t(i,a){let n=e.get(i),s;return n===void 0?(s=new el,e.set(i,[s])):a>=n.length?(s=new el,n.push(s)):s=n[a],s}function r(){e=new WeakMap}return{get:t,dispose:r}}function hm(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let r;switch(t.type){case"DirectionalLight":r={direction:new L,color:new We};break;case"SpotLight":r={position:new L,direction:new L,color:new We,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":r={position:new L,color:new We,distance:0,decay:0};break;case"HemisphereLight":r={direction:new L,skyColor:new We,groundColor:new We};break;case"RectAreaLight":r={color:new We,position:new L,halfWidth:new L,halfHeight:new L};break}return e[t.id]=r,r}}}function cm(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let r;switch(t.type){case"DirectionalLight":r={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new we};break;case"SpotLight":r={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new we};break;case"PointLight":r={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new we,shadowCameraNear:1,shadowCameraFar:1e3};break}return e[t.id]=r,r}}}var um=0;function dm(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+(t.map?1:0)-(e.map?1:0)}function pm(e){let t=new hm,r=cm(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)i.probe.push(new L);let a=new L,n=new ht,s=new ht;function o(h){let c=0,u=0,d=0;for(let E=0;E<9;E++)i.probe[E].set(0,0,0);let f=0,x=0,_=0,m=0,p=0,b=0,M=0,T=0,D=0,w=0,A=0;h.sort(dm);for(let E=0,y=h.length;E<y;E++){let U=h[E],V=U.color,B=U.intensity,X=U.distance,Y=U.shadow&&U.shadow.map?U.shadow.map.texture:null;if(U.isAmbientLight)c+=V.r*B,u+=V.g*B,d+=V.b*B;else if(U.isLightProbe){for(let k=0;k<9;k++)i.probe[k].addScaledVector(U.sh.coefficients[k],B);A++}else if(U.isDirectionalLight){let k=t.get(U);if(k.color.copy(U.color).multiplyScalar(U.intensity),U.castShadow){let $=U.shadow,q=r.get(U);q.shadowIntensity=$.intensity,q.shadowBias=$.bias,q.shadowNormalBias=$.normalBias,q.shadowRadius=$.radius,q.shadowMapSize=$.mapSize,i.directionalShadow[f]=q,i.directionalShadowMap[f]=Y,i.directionalShadowMatrix[f]=U.shadow.matrix,b++}i.directional[f]=k,f++}else if(U.isSpotLight){let k=t.get(U);k.position.setFromMatrixPosition(U.matrixWorld),k.color.copy(V).multiplyScalar(B),k.distance=X,k.coneCos=Math.cos(U.angle),k.penumbraCos=Math.cos(U.angle*(1-U.penumbra)),k.decay=U.decay,i.spot[_]=k;let $=U.shadow;if(U.map&&(i.spotLightMap[D]=U.map,D++,$.updateMatrices(U),U.castShadow&&w++),i.spotLightMatrix[_]=$.matrix,U.castShadow){let q=r.get(U);q.shadowIntensity=$.intensity,q.shadowBias=$.bias,q.shadowNormalBias=$.normalBias,q.shadowRadius=$.radius,q.shadowMapSize=$.mapSize,i.spotShadow[_]=q,i.spotShadowMap[_]=Y,T++}_++}else if(U.isRectAreaLight){let k=t.get(U);k.color.copy(V).multiplyScalar(B),k.halfWidth.set(U.width*.5,0,0),k.halfHeight.set(0,U.height*.5,0),i.rectArea[m]=k,m++}else if(U.isPointLight){let k=t.get(U);if(k.color.copy(U.color).multiplyScalar(U.intensity),k.distance=U.distance,k.decay=U.decay,U.castShadow){let $=U.shadow,q=r.get(U);q.shadowIntensity=$.intensity,q.shadowBias=$.bias,q.shadowNormalBias=$.normalBias,q.shadowRadius=$.radius,q.shadowMapSize=$.mapSize,q.shadowCameraNear=$.camera.near,q.shadowCameraFar=$.camera.far,i.pointShadow[x]=q,i.pointShadowMap[x]=Y,i.pointShadowMatrix[x]=U.shadow.matrix,M++}i.point[x]=k,x++}else if(U.isHemisphereLight){let k=t.get(U);k.skyColor.copy(U.color).multiplyScalar(B),k.groundColor.copy(U.groundColor).multiplyScalar(B),i.hemi[p]=k,p++}}m>0&&(e.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=se.LTC_FLOAT_1,i.rectAreaLTC2=se.LTC_FLOAT_2):(i.rectAreaLTC1=se.LTC_HALF_1,i.rectAreaLTC2=se.LTC_HALF_2)),i.ambient[0]=c,i.ambient[1]=u,i.ambient[2]=d;let O=i.hash;(O.directionalLength!==f||O.pointLength!==x||O.spotLength!==_||O.rectAreaLength!==m||O.hemiLength!==p||O.numDirectionalShadows!==b||O.numPointShadows!==M||O.numSpotShadows!==T||O.numSpotMaps!==D||O.numLightProbes!==A)&&(i.directional.length=f,i.spot.length=_,i.rectArea.length=m,i.point.length=x,i.hemi.length=p,i.directionalShadow.length=b,i.directionalShadowMap.length=b,i.pointShadow.length=M,i.pointShadowMap.length=M,i.spotShadow.length=T,i.spotShadowMap.length=T,i.directionalShadowMatrix.length=b,i.pointShadowMatrix.length=M,i.spotLightMatrix.length=T+D-w,i.spotLightMap.length=D,i.numSpotLightShadowsWithMaps=w,i.numLightProbes=A,O.directionalLength=f,O.pointLength=x,O.spotLength=_,O.rectAreaLength=m,O.hemiLength=p,O.numDirectionalShadows=b,O.numPointShadows=M,O.numSpotShadows=T,O.numSpotMaps=D,O.numLightProbes=A,i.version=um++)}function l(h,c){let u=0,d=0,f=0,x=0,_=0,m=c.matrixWorldInverse;for(let p=0,b=h.length;p<b;p++){let M=h[p];if(M.isDirectionalLight){let T=i.directional[u];T.direction.setFromMatrixPosition(M.matrixWorld),a.setFromMatrixPosition(M.target.matrixWorld),T.direction.sub(a),T.direction.transformDirection(m),u++}else if(M.isSpotLight){let T=i.spot[f];T.position.setFromMatrixPosition(M.matrixWorld),T.position.applyMatrix4(m),T.direction.setFromMatrixPosition(M.matrixWorld),a.setFromMatrixPosition(M.target.matrixWorld),T.direction.sub(a),T.direction.transformDirection(m),f++}else if(M.isRectAreaLight){let T=i.rectArea[x];T.position.setFromMatrixPosition(M.matrixWorld),T.position.applyMatrix4(m),s.identity(),n.copy(M.matrixWorld),n.premultiply(m),s.extractRotation(n),T.halfWidth.set(M.width*.5,0,0),T.halfHeight.set(0,M.height*.5,0),T.halfWidth.applyMatrix4(s),T.halfHeight.applyMatrix4(s),x++}else if(M.isPointLight){let T=i.point[d];T.position.setFromMatrixPosition(M.matrixWorld),T.position.applyMatrix4(m),d++}else if(M.isHemisphereLight){let T=i.hemi[_];T.direction.setFromMatrixPosition(M.matrixWorld),T.direction.transformDirection(m),_++}}}return{setup:o,setupView:l,state:i}}function tl(e){let t=new pm(e),r=[],i=[];function a(c){h.camera=c,r.length=0,i.length=0}function n(c){r.push(c)}function s(c){i.push(c)}function o(){t.setup(r)}function l(c){t.setupView(r,c)}let h={lightsArray:r,shadowsArray:i,camera:null,lights:t,transmissionRenderTarget:{}};return{init:a,state:h,setupLights:o,setupLightsView:l,pushLight:n,pushShadow:s}}function fm(e){let t=new WeakMap;function r(a,n=0){let s=t.get(a),o;return s===void 0?(o=new tl(e),t.set(a,[o])):n>=s.length?(o=new tl(e),s.push(o)):o=s[n],o}function i(){t=new WeakMap}return{get:r,dispose:i}}var mm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,gm=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function _m(e,t,r){let i=new qn,a=new we,n=new we,s=new ot,o=new yc({depthPacking:eh}),l=new Mc,h={},c=r.maxTextureSize,u={[or]:xt,[xt]:or,[Jt]:Jt},d=new sr({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new we},radius:{value:4}},vertexShader:mm,fragmentShader:gm}),f=d.clone();f.defines.HORIZONTAL_PASS=1;let x=new Bt;x.setAttribute("position",new Xt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let _=new bt(x,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ys;let p=this.type;this.render=function(w,A,O){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||w.length===0)return;let E=e.getRenderTarget(),y=e.getActiveCubeFace(),U=e.getActiveMipmapLevel(),V=e.state;V.setBlending(lr),V.buffers.depth.getReversed()?V.buffers.color.setClear(0,0,0,0):V.buffers.color.setClear(1,1,1,1),V.buffers.depth.setTest(!0),V.setScissorTest(!1);let B=p!==Kt&&this.type===Kt,X=p===Kt&&this.type!==Kt;for(let Y=0,k=w.length;Y<k;Y++){let $=w[Y],q=$.shadow;if(q===void 0){console.warn("THREE.WebGLShadowMap:",$,"has no shadow.");continue}if(q.autoUpdate===!1&&q.needsUpdate===!1)continue;a.copy(q.mapSize);let K=q.getFrameExtents();if(a.multiply(K),n.copy(q.mapSize),(a.x>c||a.y>c)&&(a.x>c&&(n.x=Math.floor(c/K.x),a.x=n.x*K.x,q.mapSize.x=n.x),a.y>c&&(n.y=Math.floor(c/K.y),a.y=n.y*K.y,q.mapSize.y=n.y)),q.map===null||B===!0||X===!0){let De=this.type!==Kt?{minFilter:Lt,magFilter:Lt}:{};q.map!==null&&q.map.dispose(),q.map=new Tr(a.x,a.y,De),q.map.texture.name=$.name+".shadowMap",q.camera.updateProjectionMatrix()}e.setRenderTarget(q.map),e.clear();let me=q.getViewportCount();for(let De=0;De<me;De++){let Pe=q.getViewport(De);s.set(n.x*Pe.x,n.y*Pe.y,n.x*Pe.z,n.y*Pe.w),V.viewport(s),q.updateMatrices($,De),i=q.getFrustum(),T(A,O,q.camera,$,this.type)}q.isPointLightShadow!==!0&&this.type===Kt&&b(q,O),q.needsUpdate=!1}p=this.type,m.needsUpdate=!1,e.setRenderTarget(E,y,U)};function b(w,A){let O=t.update(_);d.defines.VSM_SAMPLES!==w.blurSamples&&(d.defines.VSM_SAMPLES=w.blurSamples,f.defines.VSM_SAMPLES=w.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),w.mapPass===null&&(w.mapPass=new Tr(a.x,a.y)),d.uniforms.shadow_pass.value=w.map.texture,d.uniforms.resolution.value=w.mapSize,d.uniforms.radius.value=w.radius,e.setRenderTarget(w.mapPass),e.clear(),e.renderBufferDirect(A,null,O,d,_,null),f.uniforms.shadow_pass.value=w.mapPass.texture,f.uniforms.resolution.value=w.mapSize,f.uniforms.radius.value=w.radius,e.setRenderTarget(w.map),e.clear(),e.renderBufferDirect(A,null,O,f,_,null)}function M(w,A,O,E){let y=null,U=O.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(U!==void 0)y=U;else if(y=O.isPointLight===!0?l:o,e.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0||A.alphaToCoverage===!0){let V=y.uuid,B=A.uuid,X=h[V];X===void 0&&(X={},h[V]=X);let Y=X[B];Y===void 0&&(Y=y.clone(),X[B]=Y,A.addEventListener("dispose",D)),y=Y}if(y.visible=A.visible,y.wireframe=A.wireframe,E===Kt?y.side=A.shadowSide!==null?A.shadowSide:A.side:y.side=A.shadowSide!==null?A.shadowSide:u[A.side],y.alphaMap=A.alphaMap,y.alphaTest=A.alphaToCoverage===!0?.5:A.alphaTest,y.map=A.map,y.clipShadows=A.clipShadows,y.clippingPlanes=A.clippingPlanes,y.clipIntersection=A.clipIntersection,y.displacementMap=A.displacementMap,y.displacementScale=A.displacementScale,y.displacementBias=A.displacementBias,y.wireframeLinewidth=A.wireframeLinewidth,y.linewidth=A.linewidth,O.isPointLight===!0&&y.isMeshDistanceMaterial===!0){let V=e.properties.get(y);V.light=O}return y}function T(w,A,O,E,y){if(w.visible===!1)return;if(w.layers.test(A.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&y===Kt)&&(!w.frustumCulled||i.intersectsObject(w))){w.modelViewMatrix.multiplyMatrices(O.matrixWorldInverse,w.matrixWorld);let V=t.update(w),B=w.material;if(Array.isArray(B)){let X=V.groups;for(let Y=0,k=X.length;Y<k;Y++){let $=X[Y],q=B[$.materialIndex];if(q&&q.visible){let K=M(w,q,E,y);w.onBeforeShadow(e,w,A,O,V,K,$),e.renderBufferDirect(O,null,V,K,w,$),w.onAfterShadow(e,w,A,O,V,K,$)}}}else if(B.visible){let X=M(w,B,E,y);w.onBeforeShadow(e,w,A,O,V,X,null),e.renderBufferDirect(O,null,V,X,w,null),w.onAfterShadow(e,w,A,O,V,X,null)}}let U=w.children;for(let V=0,B=U.length;V<B;V++)T(U[V],A,O,E,y)}function D(w){w.target.removeEventListener("dispose",D);for(let A in h){let O=h[A],E=w.target.uuid;E in O&&(O[E].dispose(),delete O[E])}}}var vm={[Ca]:Pa,[Ua]:Ia,[La]:Na,[Or]:Da,[Pa]:Ca,[Ia]:Ua,[Na]:La,[Da]:Or};function xm(e,t){function r(){let C=!1,le=new ot,ae=null,Se=new ot(0,0,0,0);return{setMask:function(ee){ae!==ee&&!C&&(e.colorMask(ee,ee,ee,ee),ae=ee)},setLocked:function(ee){C=ee},setClear:function(ee,Z,xe,Ce,st){st===!0&&(ee*=Ce,Z*=Ce,xe*=Ce),le.set(ee,Z,xe,Ce),Se.equals(le)===!1&&(e.clearColor(ee,Z,xe,Ce),Se.copy(le))},reset:function(){C=!1,ae=null,Se.set(-1,0,0,0)}}}function i(){let C=!1,le=!1,ae=null,Se=null,ee=null;return{setReversed:function(Z){if(le!==Z){let xe=t.get("EXT_clip_control");Z?xe.clipControlEXT(xe.LOWER_LEFT_EXT,xe.ZERO_TO_ONE_EXT):xe.clipControlEXT(xe.LOWER_LEFT_EXT,xe.NEGATIVE_ONE_TO_ONE_EXT),le=Z;let Ce=ee;ee=null,this.setClear(Ce)}},getReversed:function(){return le},setTest:function(Z){Z?de(e.DEPTH_TEST):he(e.DEPTH_TEST)},setMask:function(Z){ae!==Z&&!C&&(e.depthMask(Z),ae=Z)},setFunc:function(Z){if(le&&(Z=vm[Z]),Se!==Z){switch(Z){case Ca:e.depthFunc(e.NEVER);break;case Pa:e.depthFunc(e.ALWAYS);break;case Ua:e.depthFunc(e.LESS);break;case Or:e.depthFunc(e.LEQUAL);break;case La:e.depthFunc(e.EQUAL);break;case Da:e.depthFunc(e.GEQUAL);break;case Ia:e.depthFunc(e.GREATER);break;case Na:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}Se=Z}},setLocked:function(Z){C=Z},setClear:function(Z){ee!==Z&&(le&&(Z=1-Z),e.clearDepth(Z),ee=Z)},reset:function(){C=!1,ae=null,Se=null,ee=null,le=!1}}}function a(){let C=!1,le=null,ae=null,Se=null,ee=null,Z=null,xe=null,Ce=null,st=null;return{setTest:function(qe){C||(qe?de(e.STENCIL_TEST):he(e.STENCIL_TEST))},setMask:function(qe){le!==qe&&!C&&(e.stencilMask(qe),le=qe)},setFunc:function(qe,Ht,Vt){(ae!==qe||Se!==Ht||ee!==Vt)&&(e.stencilFunc(qe,Ht,Vt),ae=qe,Se=Ht,ee=Vt)},setOp:function(qe,Ht,Vt){(Z!==qe||xe!==Ht||Ce!==Vt)&&(e.stencilOp(qe,Ht,Vt),Z=qe,xe=Ht,Ce=Vt)},setLocked:function(qe){C=qe},setClear:function(qe){st!==qe&&(e.clearStencil(qe),st=qe)},reset:function(){C=!1,le=null,ae=null,Se=null,ee=null,Z=null,xe=null,Ce=null,st=null}}}let n=new r,s=new i,o=new a,l=new WeakMap,h=new WeakMap,c={},u={},d=new WeakMap,f=[],x=null,_=!1,m=null,p=null,b=null,M=null,T=null,D=null,w=null,A=new We(0,0,0),O=0,E=!1,y=null,U=null,V=null,B=null,X=null,Y=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),k=!1,$=0,q=e.getParameter(e.VERSION);q.indexOf("WebGL")!==-1?($=parseFloat(/^WebGL (\d)/.exec(q)[1]),k=$>=1):q.indexOf("OpenGL ES")!==-1&&($=parseFloat(/^OpenGL ES (\d)/.exec(q)[1]),k=$>=2);let K=null,me={},De=e.getParameter(e.SCISSOR_BOX),Pe=e.getParameter(e.VIEWPORT),Fe=new ot().fromArray(De),j=new ot().fromArray(Pe);function re(C,le,ae,Se){let ee=new Uint8Array(4),Z=e.createTexture();e.bindTexture(C,Z),e.texParameteri(C,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(C,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let xe=0;xe<ae;xe++)C===e.TEXTURE_3D||C===e.TEXTURE_2D_ARRAY?e.texImage3D(le,0,e.RGBA,1,1,Se,0,e.RGBA,e.UNSIGNED_BYTE,ee):e.texImage2D(le+xe,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,ee);return Z}let ye={};ye[e.TEXTURE_2D]=re(e.TEXTURE_2D,e.TEXTURE_2D,1),ye[e.TEXTURE_CUBE_MAP]=re(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),ye[e.TEXTURE_2D_ARRAY]=re(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),ye[e.TEXTURE_3D]=re(e.TEXTURE_3D,e.TEXTURE_3D,1,1),n.setClear(0,0,0,1),s.setClear(1),o.setClear(0),de(e.DEPTH_TEST),s.setFunc(Or),pe(!1),Ze(xs),de(e.CULL_FACE),Ve(lr);function de(C){c[C]!==!0&&(e.enable(C),c[C]=!0)}function he(C){c[C]!==!1&&(e.disable(C),c[C]=!1)}function Re(C,le){return u[C]!==le?(e.bindFramebuffer(C,le),u[C]=le,C===e.DRAW_FRAMEBUFFER&&(u[e.FRAMEBUFFER]=le),C===e.FRAMEBUFFER&&(u[e.DRAW_FRAMEBUFFER]=le),!0):!1}function Ne(C,le){let ae=f,Se=!1;if(C){ae=d.get(le),ae===void 0&&(ae=[],d.set(le,ae));let ee=C.textures;if(ae.length!==ee.length||ae[0]!==e.COLOR_ATTACHMENT0){for(let Z=0,xe=ee.length;Z<xe;Z++)ae[Z]=e.COLOR_ATTACHMENT0+Z;ae.length=ee.length,Se=!0}}else ae[0]!==e.BACK&&(ae[0]=e.BACK,Se=!0);Se&&e.drawBuffers(ae)}function je(C){return x!==C?(e.useProgram(C),x=C,!0):!1}let R={[yr]:e.FUNC_ADD,[Al]:e.FUNC_SUBTRACT,[Rl]:e.FUNC_REVERSE_SUBTRACT};R[Cl]=e.MIN,R[Pl]=e.MAX;let it={[Ul]:e.ZERO,[Ll]:e.ONE,[Dl]:e.SRC_COLOR,[Aa]:e.SRC_ALPHA,[zl]:e.SRC_ALPHA_SATURATE,[Fl]:e.DST_COLOR,[Nl]:e.DST_ALPHA,[Il]:e.ONE_MINUS_SRC_COLOR,[Ra]:e.ONE_MINUS_SRC_ALPHA,[Bl]:e.ONE_MINUS_DST_COLOR,[Ol]:e.ONE_MINUS_DST_ALPHA,[Hl]:e.CONSTANT_COLOR,[Vl]:e.ONE_MINUS_CONSTANT_COLOR,[Gl]:e.CONSTANT_ALPHA,[kl]:e.ONE_MINUS_CONSTANT_ALPHA};function Ve(C,le,ae,Se,ee,Z,xe,Ce,st,qe){if(C===lr){_===!0&&(he(e.BLEND),_=!1);return}if(_===!1&&(de(e.BLEND),_=!0),C!==wl){if(C!==m||qe!==E){if((p!==yr||T!==yr)&&(e.blendEquation(e.FUNC_ADD),p=yr,T=yr),qe)switch(C){case Nr:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case wa:e.blendFunc(e.ONE,e.ONE);break;case Ms:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case Ss:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",C);break}else switch(C){case Nr:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case wa:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case Ms:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Ss:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",C);break}b=null,M=null,D=null,w=null,A.set(0,0,0),O=0,m=C,E=qe}return}ee=ee||le,Z=Z||ae,xe=xe||Se,(le!==p||ee!==T)&&(e.blendEquationSeparate(R[le],R[ee]),p=le,T=ee),(ae!==b||Se!==M||Z!==D||xe!==w)&&(e.blendFuncSeparate(it[ae],it[Se],it[Z],it[xe]),b=ae,M=Se,D=Z,w=xe),(Ce.equals(A)===!1||st!==O)&&(e.blendColor(Ce.r,Ce.g,Ce.b,st),A.copy(Ce),O=st),m=C,E=!1}function Ge(C,le){C.side===Jt?he(e.CULL_FACE):de(e.CULL_FACE);let ae=C.side===xt;le&&(ae=!ae),pe(ae),C.blending===Nr&&C.transparent===!1?Ve(lr):Ve(C.blending,C.blendEquation,C.blendSrc,C.blendDst,C.blendEquationAlpha,C.blendSrcAlpha,C.blendDstAlpha,C.blendColor,C.blendAlpha,C.premultipliedAlpha),s.setFunc(C.depthFunc),s.setTest(C.depthTest),s.setMask(C.depthWrite),n.setMask(C.colorWrite);let Se=C.stencilWrite;o.setTest(Se),Se&&(o.setMask(C.stencilWriteMask),o.setFunc(C.stencilFunc,C.stencilRef,C.stencilFuncMask),o.setOp(C.stencilFail,C.stencilZFail,C.stencilZPass)),Ae(C.polygonOffset,C.polygonOffsetFactor,C.polygonOffsetUnits),C.alphaToCoverage===!0?de(e.SAMPLE_ALPHA_TO_COVERAGE):he(e.SAMPLE_ALPHA_TO_COVERAGE)}function pe(C){y!==C&&(C?e.frontFace(e.CW):e.frontFace(e.CCW),y=C)}function Ze(C){C!==El?(de(e.CULL_FACE),C!==U&&(C===xs?e.cullFace(e.BACK):C===Tl?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))):he(e.CULL_FACE),U=C}function Ee(C){C!==V&&(k&&e.lineWidth(C),V=C)}function Ae(C,le,ae){C?(de(e.POLYGON_OFFSET_FILL),(B!==le||X!==ae)&&(e.polygonOffset(le,ae),B=le,X=ae)):he(e.POLYGON_OFFSET_FILL)}function nt(C){C?de(e.SCISSOR_TEST):he(e.SCISSOR_TEST)}function at(C){C===void 0&&(C=e.TEXTURE0+Y-1),K!==C&&(e.activeTexture(C),K=C)}function ne(C,le,ae){ae===void 0&&(K===null?ae=e.TEXTURE0+Y-1:ae=K);let Se=me[ae];Se===void 0&&(Se={type:void 0,texture:void 0},me[ae]=Se),(Se.type!==C||Se.texture!==le)&&(K!==ae&&(e.activeTexture(ae),K=ae),e.bindTexture(C,le||ye[C]),Se.type=C,Se.texture=le)}function S(){let C=me[K];C!==void 0&&C.type!==void 0&&(e.bindTexture(C.type,null),C.type=void 0,C.texture=void 0)}function g(){try{e.compressedTexImage2D(...arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function P(){try{e.compressedTexImage3D(...arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function z(){try{e.texSubImage2D(...arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function W(){try{e.texSubImage3D(...arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function F(){try{e.compressedTexSubImage2D(...arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function ce(){try{e.compressedTexSubImage3D(...arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function te(){try{e.texStorage2D(...arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function ge(){try{e.texStorage3D(...arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Te(){try{e.texImage2D(...arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Q(){try{e.texImage3D(...arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function oe(C){Fe.equals(C)===!1&&(e.scissor(C.x,C.y,C.z,C.w),Fe.copy(C))}function ie(C){j.equals(C)===!1&&(e.viewport(C.x,C.y,C.z,C.w),j.copy(C))}function Me(C,le){let ae=h.get(le);ae===void 0&&(ae=new WeakMap,h.set(le,ae));let Se=ae.get(C);Se===void 0&&(Se=e.getUniformBlockIndex(le,C.name),ae.set(C,Se))}function ue(C,le){let ae=h.get(le).get(C);l.get(le)!==ae&&(e.uniformBlockBinding(le,ae,C.__bindingPointIndex),l.set(le,ae))}function Oe(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),s.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),c={},K=null,me={},u={},d=new WeakMap,f=[],x=null,_=!1,m=null,p=null,b=null,M=null,T=null,D=null,w=null,A=new We(0,0,0),O=0,E=!1,y=null,U=null,V=null,B=null,X=null,Fe.set(0,0,e.canvas.width,e.canvas.height),j.set(0,0,e.canvas.width,e.canvas.height),n.reset(),s.reset(),o.reset()}return{buffers:{color:n,depth:s,stencil:o},enable:de,disable:he,bindFramebuffer:Re,drawBuffers:Ne,useProgram:je,setBlending:Ve,setMaterial:Ge,setFlipSided:pe,setCullFace:Ze,setLineWidth:Ee,setPolygonOffset:Ae,setScissorTest:nt,activeTexture:at,bindTexture:ne,unbindTexture:S,compressedTexImage2D:g,compressedTexImage3D:P,texImage2D:Te,texImage3D:Q,updateUBOMapping:Me,uniformBlockBinding:ue,texStorage2D:te,texStorage3D:ge,texSubImage2D:z,texSubImage3D:W,compressedTexSubImage2D:F,compressedTexSubImage3D:ce,scissor:oe,viewport:ie,reset:Oe}}function ym(e,t,r,i,a,n,s){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new we,c=new WeakMap,u,d=new WeakMap,f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function x(S,g){return f?new OffscreenCanvas(S,g):ji("canvas")}function _(S,g,P){let z=1,W=ne(S);if((W.width>P||W.height>P)&&(z=P/Math.max(W.width,W.height)),z<1)if(typeof HTMLImageElement<"u"&&S instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&S instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&S instanceof ImageBitmap||typeof VideoFrame<"u"&&S instanceof VideoFrame){let F=Math.floor(z*W.width),ce=Math.floor(z*W.height);u===void 0&&(u=x(F,ce));let te=g?x(F,ce):u;return te.width=F,te.height=ce,te.getContext("2d").drawImage(S,0,0,F,ce),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+W.width+"x"+W.height+") to ("+F+"x"+ce+")."),te}else return"data"in S&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+W.width+"x"+W.height+")."),S;return S}function m(S){return S.generateMipmaps}function p(S){e.generateMipmap(S)}function b(S){return S.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:S.isWebGL3DRenderTarget?e.TEXTURE_3D:S.isWebGLArrayRenderTarget||S.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function M(S,g,P,z,W=!1){if(S!==null){if(e[S]!==void 0)return e[S];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+S+"'")}let F=g;if(g===e.RED&&(P===e.FLOAT&&(F=e.R32F),P===e.HALF_FLOAT&&(F=e.R16F),P===e.UNSIGNED_BYTE&&(F=e.R8)),g===e.RED_INTEGER&&(P===e.UNSIGNED_BYTE&&(F=e.R8UI),P===e.UNSIGNED_SHORT&&(F=e.R16UI),P===e.UNSIGNED_INT&&(F=e.R32UI),P===e.BYTE&&(F=e.R8I),P===e.SHORT&&(F=e.R16I),P===e.INT&&(F=e.R32I)),g===e.RG&&(P===e.FLOAT&&(F=e.RG32F),P===e.HALF_FLOAT&&(F=e.RG16F),P===e.UNSIGNED_BYTE&&(F=e.RG8)),g===e.RG_INTEGER&&(P===e.UNSIGNED_BYTE&&(F=e.RG8UI),P===e.UNSIGNED_SHORT&&(F=e.RG16UI),P===e.UNSIGNED_INT&&(F=e.RG32UI),P===e.BYTE&&(F=e.RG8I),P===e.SHORT&&(F=e.RG16I),P===e.INT&&(F=e.RG32I)),g===e.RGB_INTEGER&&(P===e.UNSIGNED_BYTE&&(F=e.RGB8UI),P===e.UNSIGNED_SHORT&&(F=e.RGB16UI),P===e.UNSIGNED_INT&&(F=e.RGB32UI),P===e.BYTE&&(F=e.RGB8I),P===e.SHORT&&(F=e.RGB16I),P===e.INT&&(F=e.RGB32I)),g===e.RGBA_INTEGER&&(P===e.UNSIGNED_BYTE&&(F=e.RGBA8UI),P===e.UNSIGNED_SHORT&&(F=e.RGBA16UI),P===e.UNSIGNED_INT&&(F=e.RGBA32UI),P===e.BYTE&&(F=e.RGBA8I),P===e.SHORT&&(F=e.RGBA16I),P===e.INT&&(F=e.RGBA32I)),g===e.RGB&&P===e.UNSIGNED_INT_5_9_9_9_REV&&(F=e.RGB9_E5),g===e.RGBA){let ce=W?Wi:Xe.getTransfer(z);P===e.FLOAT&&(F=e.RGBA32F),P===e.HALF_FLOAT&&(F=e.RGBA16F),P===e.UNSIGNED_BYTE&&(F=ce===Ye?e.SRGB8_ALPHA8:e.RGBA8),P===e.UNSIGNED_SHORT_4_4_4_4&&(F=e.RGBA4),P===e.UNSIGNED_SHORT_5_5_5_1&&(F=e.RGB5_A1)}return(F===e.R16F||F===e.R32F||F===e.RG16F||F===e.RG32F||F===e.RGBA16F||F===e.RGBA32F)&&t.get("EXT_color_buffer_float"),F}function T(S,g){let P;return S?g===null||g===Er||g===fi?P=e.DEPTH24_STENCIL8:g===$t?P=e.DEPTH32F_STENCIL8:g===di&&(P=e.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):g===null||g===Er||g===fi?P=e.DEPTH_COMPONENT24:g===$t?P=e.DEPTH_COMPONENT32F:g===di&&(P=e.DEPTH_COMPONENT16),P}function D(S,g){return m(S)===!0||S.isFramebufferTexture&&S.minFilter!==Lt&&S.minFilter!==Gt?Math.log2(Math.max(g.width,g.height))+1:S.mipmaps!==void 0&&S.mipmaps.length>0?S.mipmaps.length:S.isCompressedTexture&&Array.isArray(S.image)?g.mipmaps.length:1}function w(S){let g=S.target;g.removeEventListener("dispose",w),O(g),g.isVideoTexture&&c.delete(g)}function A(S){let g=S.target;g.removeEventListener("dispose",A),y(g)}function O(S){let g=i.get(S);if(g.__webglInit===void 0)return;let P=S.source,z=d.get(P);if(z){let W=z[g.__cacheKey];W.usedTimes--,W.usedTimes===0&&E(S),Object.keys(z).length===0&&d.delete(P)}i.remove(S)}function E(S){let g=i.get(S);e.deleteTexture(g.__webglTexture);let P=S.source,z=d.get(P);delete z[g.__cacheKey],s.memory.textures--}function y(S){let g=i.get(S);if(S.depthTexture&&(S.depthTexture.dispose(),i.remove(S.depthTexture)),S.isWebGLCubeRenderTarget)for(let z=0;z<6;z++){if(Array.isArray(g.__webglFramebuffer[z]))for(let W=0;W<g.__webglFramebuffer[z].length;W++)e.deleteFramebuffer(g.__webglFramebuffer[z][W]);else e.deleteFramebuffer(g.__webglFramebuffer[z]);g.__webglDepthbuffer&&e.deleteRenderbuffer(g.__webglDepthbuffer[z])}else{if(Array.isArray(g.__webglFramebuffer))for(let z=0;z<g.__webglFramebuffer.length;z++)e.deleteFramebuffer(g.__webglFramebuffer[z]);else e.deleteFramebuffer(g.__webglFramebuffer);if(g.__webglDepthbuffer&&e.deleteRenderbuffer(g.__webglDepthbuffer),g.__webglMultisampledFramebuffer&&e.deleteFramebuffer(g.__webglMultisampledFramebuffer),g.__webglColorRenderbuffer)for(let z=0;z<g.__webglColorRenderbuffer.length;z++)g.__webglColorRenderbuffer[z]&&e.deleteRenderbuffer(g.__webglColorRenderbuffer[z]);g.__webglDepthRenderbuffer&&e.deleteRenderbuffer(g.__webglDepthRenderbuffer)}let P=S.textures;for(let z=0,W=P.length;z<W;z++){let F=i.get(P[z]);F.__webglTexture&&(e.deleteTexture(F.__webglTexture),s.memory.textures--),i.remove(P[z])}i.remove(S)}let U=0;function V(){U=0}function B(){let S=U;return S>=a.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+S+" texture units while this GPU supports only "+a.maxTextures),U+=1,S}function X(S){let g=[];return g.push(S.wrapS),g.push(S.wrapT),g.push(S.wrapR||0),g.push(S.magFilter),g.push(S.minFilter),g.push(S.anisotropy),g.push(S.internalFormat),g.push(S.format),g.push(S.type),g.push(S.generateMipmaps),g.push(S.premultiplyAlpha),g.push(S.flipY),g.push(S.unpackAlignment),g.push(S.colorSpace),g.join()}function Y(S,g){let P=i.get(S);if(S.isVideoTexture&&nt(S),S.isRenderTargetTexture===!1&&S.isExternalTexture!==!0&&S.version>0&&P.__version!==S.version){let z=S.image;if(z===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(z.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{ye(P,S,g);return}}else S.isExternalTexture&&(P.__webglTexture=S.sourceTexture?S.sourceTexture:null);r.bindTexture(e.TEXTURE_2D,P.__webglTexture,e.TEXTURE0+g)}function k(S,g){let P=i.get(S);if(S.isRenderTargetTexture===!1&&S.version>0&&P.__version!==S.version){ye(P,S,g);return}r.bindTexture(e.TEXTURE_2D_ARRAY,P.__webglTexture,e.TEXTURE0+g)}function $(S,g){let P=i.get(S);if(S.isRenderTargetTexture===!1&&S.version>0&&P.__version!==S.version){ye(P,S,g);return}r.bindTexture(e.TEXTURE_3D,P.__webglTexture,e.TEXTURE0+g)}function q(S,g){let P=i.get(S);if(S.version>0&&P.__version!==S.version){de(P,S,g);return}r.bindTexture(e.TEXTURE_CUBE_MAP,P.__webglTexture,e.TEXTURE0+g)}let K={[Oi]:e.REPEAT,[Mr]:e.CLAMP_TO_EDGE,[Ba]:e.MIRRORED_REPEAT},me={[Lt]:e.NEAREST,[$l]:e.NEAREST_MIPMAP_NEAREST,[Fi]:e.NEAREST_MIPMAP_LINEAR,[Gt]:e.LINEAR,[za]:e.LINEAR_MIPMAP_NEAREST,[Sr]:e.LINEAR_MIPMAP_LINEAR},De={[rh]:e.NEVER,[lh]:e.ALWAYS,[ih]:e.LESS,[zs]:e.LEQUAL,[ah]:e.EQUAL,[oh]:e.GEQUAL,[nh]:e.GREATER,[sh]:e.NOTEQUAL};function Pe(S,g){if(g.type===$t&&t.has("OES_texture_float_linear")===!1&&(g.magFilter===Gt||g.magFilter===za||g.magFilter===Fi||g.magFilter===Sr||g.minFilter===Gt||g.minFilter===za||g.minFilter===Fi||g.minFilter===Sr)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),e.texParameteri(S,e.TEXTURE_WRAP_S,K[g.wrapS]),e.texParameteri(S,e.TEXTURE_WRAP_T,K[g.wrapT]),(S===e.TEXTURE_3D||S===e.TEXTURE_2D_ARRAY)&&e.texParameteri(S,e.TEXTURE_WRAP_R,K[g.wrapR]),e.texParameteri(S,e.TEXTURE_MAG_FILTER,me[g.magFilter]),e.texParameteri(S,e.TEXTURE_MIN_FILTER,me[g.minFilter]),g.compareFunction&&(e.texParameteri(S,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(S,e.TEXTURE_COMPARE_FUNC,De[g.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(g.magFilter===Lt||g.minFilter!==Fi&&g.minFilter!==Sr||g.type===$t&&t.has("OES_texture_float_linear")===!1)return;if(g.anisotropy>1||i.get(g).__currentAnisotropy){let P=t.get("EXT_texture_filter_anisotropic");e.texParameterf(S,P.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(g.anisotropy,a.getMaxAnisotropy())),i.get(g).__currentAnisotropy=g.anisotropy}}}function Fe(S,g){let P=!1;S.__webglInit===void 0&&(S.__webglInit=!0,g.addEventListener("dispose",w));let z=g.source,W=d.get(z);W===void 0&&(W={},d.set(z,W));let F=X(g);if(F!==S.__cacheKey){W[F]===void 0&&(W[F]={texture:e.createTexture(),usedTimes:0},s.memory.textures++,P=!0),W[F].usedTimes++;let ce=W[S.__cacheKey];ce!==void 0&&(W[S.__cacheKey].usedTimes--,ce.usedTimes===0&&E(g)),S.__cacheKey=F,S.__webglTexture=W[F].texture}return P}function j(S,g,P){return Math.floor(Math.floor(S/P)/g)}function re(S,g,P,z){let W=S.updateRanges;if(W.length===0)r.texSubImage2D(e.TEXTURE_2D,0,0,0,g.width,g.height,P,z,g.data);else{W.sort((Te,Q)=>Te.start-Q.start);let F=0;for(let Te=1;Te<W.length;Te++){let Q=W[F],oe=W[Te],ie=Q.start+Q.count,Me=j(oe.start,g.width,4),ue=j(Q.start,g.width,4);oe.start<=ie+1&&Me===ue&&j(oe.start+oe.count-1,g.width,4)===Me?Q.count=Math.max(Q.count,oe.start+oe.count-Q.start):(++F,W[F]=oe)}W.length=F+1;let ce=e.getParameter(e.UNPACK_ROW_LENGTH),te=e.getParameter(e.UNPACK_SKIP_PIXELS),ge=e.getParameter(e.UNPACK_SKIP_ROWS);e.pixelStorei(e.UNPACK_ROW_LENGTH,g.width);for(let Te=0,Q=W.length;Te<Q;Te++){let oe=W[Te],ie=Math.floor(oe.start/4),Me=Math.ceil(oe.count/4),ue=ie%g.width,Oe=Math.floor(ie/g.width),C=Me;e.pixelStorei(e.UNPACK_SKIP_PIXELS,ue),e.pixelStorei(e.UNPACK_SKIP_ROWS,Oe),r.texSubImage2D(e.TEXTURE_2D,0,ue,Oe,C,1,P,z,g.data)}S.clearUpdateRanges(),e.pixelStorei(e.UNPACK_ROW_LENGTH,ce),e.pixelStorei(e.UNPACK_SKIP_PIXELS,te),e.pixelStorei(e.UNPACK_SKIP_ROWS,ge)}}function ye(S,g,P){let z=e.TEXTURE_2D;(g.isDataArrayTexture||g.isCompressedArrayTexture)&&(z=e.TEXTURE_2D_ARRAY),g.isData3DTexture&&(z=e.TEXTURE_3D);let W=Fe(S,g),F=g.source;r.bindTexture(z,S.__webglTexture,e.TEXTURE0+P);let ce=i.get(F);if(F.version!==ce.__version||W===!0){r.activeTexture(e.TEXTURE0+P);let te=Xe.getPrimaries(Xe.workingColorSpace),ge=g.colorSpace===cr?null:Xe.getPrimaries(g.colorSpace),Te=g.colorSpace===cr||te===ge?e.NONE:e.BROWSER_DEFAULT_WEBGL;e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,g.flipY),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),e.pixelStorei(e.UNPACK_ALIGNMENT,g.unpackAlignment),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,Te);let Q=_(g.image,!1,a.maxTextureSize);Q=at(g,Q);let oe=n.convert(g.format,g.colorSpace),ie=n.convert(g.type),Me=M(g.internalFormat,oe,ie,g.colorSpace,g.isVideoTexture);Pe(z,g);let ue,Oe=g.mipmaps,C=g.isVideoTexture!==!0,le=ce.__version===void 0||W===!0,ae=F.dataReady,Se=D(g,Q);if(g.isDepthTexture)Me=T(g.format===gi,g.type),le&&(C?r.texStorage2D(e.TEXTURE_2D,1,Me,Q.width,Q.height):r.texImage2D(e.TEXTURE_2D,0,Me,Q.width,Q.height,0,oe,ie,null));else if(g.isDataTexture)if(Oe.length>0){C&&le&&r.texStorage2D(e.TEXTURE_2D,Se,Me,Oe[0].width,Oe[0].height);for(let ee=0,Z=Oe.length;ee<Z;ee++)ue=Oe[ee],C?ae&&r.texSubImage2D(e.TEXTURE_2D,ee,0,0,ue.width,ue.height,oe,ie,ue.data):r.texImage2D(e.TEXTURE_2D,ee,Me,ue.width,ue.height,0,oe,ie,ue.data);g.generateMipmaps=!1}else C?(le&&r.texStorage2D(e.TEXTURE_2D,Se,Me,Q.width,Q.height),ae&&re(g,Q,oe,ie)):r.texImage2D(e.TEXTURE_2D,0,Me,Q.width,Q.height,0,oe,ie,Q.data);else if(g.isCompressedTexture)if(g.isCompressedArrayTexture){C&&le&&r.texStorage3D(e.TEXTURE_2D_ARRAY,Se,Me,Oe[0].width,Oe[0].height,Q.depth);for(let ee=0,Z=Oe.length;ee<Z;ee++)if(ue=Oe[ee],g.format!==Dt)if(oe!==null)if(C){if(ae)if(g.layerUpdates.size>0){let xe=wo(ue.width,ue.height,g.format,g.type);for(let Ce of g.layerUpdates){let st=ue.data.subarray(Ce*xe/ue.data.BYTES_PER_ELEMENT,(Ce+1)*xe/ue.data.BYTES_PER_ELEMENT);r.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,ee,0,0,Ce,ue.width,ue.height,1,oe,st)}g.clearLayerUpdates()}else r.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,ee,0,0,0,ue.width,ue.height,Q.depth,oe,ue.data)}else r.compressedTexImage3D(e.TEXTURE_2D_ARRAY,ee,Me,ue.width,ue.height,Q.depth,0,ue.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else C?ae&&r.texSubImage3D(e.TEXTURE_2D_ARRAY,ee,0,0,0,ue.width,ue.height,Q.depth,oe,ie,ue.data):r.texImage3D(e.TEXTURE_2D_ARRAY,ee,Me,ue.width,ue.height,Q.depth,0,oe,ie,ue.data)}else{C&&le&&r.texStorage2D(e.TEXTURE_2D,Se,Me,Oe[0].width,Oe[0].height);for(let ee=0,Z=Oe.length;ee<Z;ee++)ue=Oe[ee],g.format!==Dt?oe!==null?C?ae&&r.compressedTexSubImage2D(e.TEXTURE_2D,ee,0,0,ue.width,ue.height,oe,ue.data):r.compressedTexImage2D(e.TEXTURE_2D,ee,Me,ue.width,ue.height,0,ue.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):C?ae&&r.texSubImage2D(e.TEXTURE_2D,ee,0,0,ue.width,ue.height,oe,ie,ue.data):r.texImage2D(e.TEXTURE_2D,ee,Me,ue.width,ue.height,0,oe,ie,ue.data)}else if(g.isDataArrayTexture)if(C){if(le&&r.texStorage3D(e.TEXTURE_2D_ARRAY,Se,Me,Q.width,Q.height,Q.depth),ae)if(g.layerUpdates.size>0){let ee=wo(Q.width,Q.height,g.format,g.type);for(let Z of g.layerUpdates){let xe=Q.data.subarray(Z*ee/Q.data.BYTES_PER_ELEMENT,(Z+1)*ee/Q.data.BYTES_PER_ELEMENT);r.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,Z,Q.width,Q.height,1,oe,ie,xe)}g.clearLayerUpdates()}else r.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,Q.width,Q.height,Q.depth,oe,ie,Q.data)}else r.texImage3D(e.TEXTURE_2D_ARRAY,0,Me,Q.width,Q.height,Q.depth,0,oe,ie,Q.data);else if(g.isData3DTexture)C?(le&&r.texStorage3D(e.TEXTURE_3D,Se,Me,Q.width,Q.height,Q.depth),ae&&r.texSubImage3D(e.TEXTURE_3D,0,0,0,0,Q.width,Q.height,Q.depth,oe,ie,Q.data)):r.texImage3D(e.TEXTURE_3D,0,Me,Q.width,Q.height,Q.depth,0,oe,ie,Q.data);else if(g.isFramebufferTexture){if(le)if(C)r.texStorage2D(e.TEXTURE_2D,Se,Me,Q.width,Q.height);else{let ee=Q.width,Z=Q.height;for(let xe=0;xe<Se;xe++)r.texImage2D(e.TEXTURE_2D,xe,Me,ee,Z,0,oe,ie,null),ee>>=1,Z>>=1}}else if(Oe.length>0){if(C&&le){let ee=ne(Oe[0]);r.texStorage2D(e.TEXTURE_2D,Se,Me,ee.width,ee.height)}for(let ee=0,Z=Oe.length;ee<Z;ee++)ue=Oe[ee],C?ae&&r.texSubImage2D(e.TEXTURE_2D,ee,0,0,oe,ie,ue):r.texImage2D(e.TEXTURE_2D,ee,Me,oe,ie,ue);g.generateMipmaps=!1}else if(C){if(le){let ee=ne(Q);r.texStorage2D(e.TEXTURE_2D,Se,Me,ee.width,ee.height)}ae&&r.texSubImage2D(e.TEXTURE_2D,0,0,0,oe,ie,Q)}else r.texImage2D(e.TEXTURE_2D,0,Me,oe,ie,Q);m(g)&&p(z),ce.__version=F.version,g.onUpdate&&g.onUpdate(g)}S.__version=g.version}function de(S,g,P){if(g.image.length!==6)return;let z=Fe(S,g),W=g.source;r.bindTexture(e.TEXTURE_CUBE_MAP,S.__webglTexture,e.TEXTURE0+P);let F=i.get(W);if(W.version!==F.__version||z===!0){r.activeTexture(e.TEXTURE0+P);let ce=Xe.getPrimaries(Xe.workingColorSpace),te=g.colorSpace===cr?null:Xe.getPrimaries(g.colorSpace),ge=g.colorSpace===cr||ce===te?e.NONE:e.BROWSER_DEFAULT_WEBGL;e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,g.flipY),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),e.pixelStorei(e.UNPACK_ALIGNMENT,g.unpackAlignment),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,ge);let Te=g.isCompressedTexture||g.image[0].isCompressedTexture,Q=g.image[0]&&g.image[0].isDataTexture,oe=[];for(let Z=0;Z<6;Z++)!Te&&!Q?oe[Z]=_(g.image[Z],!0,a.maxCubemapSize):oe[Z]=Q?g.image[Z].image:g.image[Z],oe[Z]=at(g,oe[Z]);let ie=oe[0],Me=n.convert(g.format,g.colorSpace),ue=n.convert(g.type),Oe=M(g.internalFormat,Me,ue,g.colorSpace),C=g.isVideoTexture!==!0,le=F.__version===void 0||z===!0,ae=W.dataReady,Se=D(g,ie);Pe(e.TEXTURE_CUBE_MAP,g);let ee;if(Te){C&&le&&r.texStorage2D(e.TEXTURE_CUBE_MAP,Se,Oe,ie.width,ie.height);for(let Z=0;Z<6;Z++){ee=oe[Z].mipmaps;for(let xe=0;xe<ee.length;xe++){let Ce=ee[xe];g.format!==Dt?Me!==null?C?ae&&r.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+Z,xe,0,0,Ce.width,Ce.height,Me,Ce.data):r.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+Z,xe,Oe,Ce.width,Ce.height,0,Ce.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):C?ae&&r.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+Z,xe,0,0,Ce.width,Ce.height,Me,ue,Ce.data):r.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+Z,xe,Oe,Ce.width,Ce.height,0,Me,ue,Ce.data)}}}else{if(ee=g.mipmaps,C&&le){ee.length>0&&Se++;let Z=ne(oe[0]);r.texStorage2D(e.TEXTURE_CUBE_MAP,Se,Oe,Z.width,Z.height)}for(let Z=0;Z<6;Z++)if(Q){C?ae&&r.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+Z,0,0,0,oe[Z].width,oe[Z].height,Me,ue,oe[Z].data):r.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+Z,0,Oe,oe[Z].width,oe[Z].height,0,Me,ue,oe[Z].data);for(let xe=0;xe<ee.length;xe++){let Ce=ee[xe].image[Z].image;C?ae&&r.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+Z,xe+1,0,0,Ce.width,Ce.height,Me,ue,Ce.data):r.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+Z,xe+1,Oe,Ce.width,Ce.height,0,Me,ue,Ce.data)}}else{C?ae&&r.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+Z,0,0,0,Me,ue,oe[Z]):r.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+Z,0,Oe,Me,ue,oe[Z]);for(let xe=0;xe<ee.length;xe++){let Ce=ee[xe];C?ae&&r.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+Z,xe+1,0,0,Me,ue,Ce.image[Z]):r.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+Z,xe+1,Oe,Me,ue,Ce.image[Z])}}}m(g)&&p(e.TEXTURE_CUBE_MAP),F.__version=W.version,g.onUpdate&&g.onUpdate(g)}S.__version=g.version}function he(S,g,P,z,W,F){let ce=n.convert(P.format,P.colorSpace),te=n.convert(P.type),ge=M(P.internalFormat,ce,te,P.colorSpace),Te=i.get(g),Q=i.get(P);if(Q.__renderTarget=g,!Te.__hasExternalTextures){let oe=Math.max(1,g.width>>F),ie=Math.max(1,g.height>>F);W===e.TEXTURE_3D||W===e.TEXTURE_2D_ARRAY?r.texImage3D(W,F,ge,oe,ie,g.depth,0,ce,te,null):r.texImage2D(W,F,ge,oe,ie,0,ce,te,null)}r.bindFramebuffer(e.FRAMEBUFFER,S),Ae(g)?o.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,z,W,Q.__webglTexture,0,Ee(g)):(W===e.TEXTURE_2D||W>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&W<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,z,W,Q.__webglTexture,F),r.bindFramebuffer(e.FRAMEBUFFER,null)}function Re(S,g,P){if(e.bindRenderbuffer(e.RENDERBUFFER,S),g.depthBuffer){let z=g.depthTexture,W=z&&z.isDepthTexture?z.type:null,F=T(g.stencilBuffer,W),ce=g.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,te=Ee(g);Ae(g)?o.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,te,F,g.width,g.height):P?e.renderbufferStorageMultisample(e.RENDERBUFFER,te,F,g.width,g.height):e.renderbufferStorage(e.RENDERBUFFER,F,g.width,g.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,ce,e.RENDERBUFFER,S)}else{let z=g.textures;for(let W=0;W<z.length;W++){let F=z[W],ce=n.convert(F.format,F.colorSpace),te=n.convert(F.type),ge=M(F.internalFormat,ce,te,F.colorSpace),Te=Ee(g);P&&Ae(g)===!1?e.renderbufferStorageMultisample(e.RENDERBUFFER,Te,ge,g.width,g.height):Ae(g)?o.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Te,ge,g.width,g.height):e.renderbufferStorage(e.RENDERBUFFER,ge,g.width,g.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Ne(S,g){if(g&&g.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(r.bindFramebuffer(e.FRAMEBUFFER,S),!(g.depthTexture&&g.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let P=i.get(g.depthTexture);P.__renderTarget=g,(!P.__webglTexture||g.depthTexture.image.width!==g.width||g.depthTexture.image.height!==g.height)&&(g.depthTexture.image.width=g.width,g.depthTexture.image.height=g.height,g.depthTexture.needsUpdate=!0),Y(g.depthTexture,0);let z=P.__webglTexture,W=Ee(g);if(g.depthTexture.format===mi)Ae(g)?o.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,e.TEXTURE_2D,z,0,W):e.framebufferTexture2D(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,e.TEXTURE_2D,z,0);else if(g.depthTexture.format===gi)Ae(g)?o.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,e.DEPTH_STENCIL_ATTACHMENT,e.TEXTURE_2D,z,0,W):e.framebufferTexture2D(e.FRAMEBUFFER,e.DEPTH_STENCIL_ATTACHMENT,e.TEXTURE_2D,z,0);else throw new Error("Unknown depthTexture format")}function je(S){let g=i.get(S),P=S.isWebGLCubeRenderTarget===!0;if(g.__boundDepthTexture!==S.depthTexture){let z=S.depthTexture;if(g.__depthDisposeCallback&&g.__depthDisposeCallback(),z){let W=()=>{delete g.__boundDepthTexture,delete g.__depthDisposeCallback,z.removeEventListener("dispose",W)};z.addEventListener("dispose",W),g.__depthDisposeCallback=W}g.__boundDepthTexture=z}if(S.depthTexture&&!g.__autoAllocateDepthBuffer){if(P)throw new Error("target.depthTexture not supported in Cube render targets");let z=S.texture.mipmaps;z&&z.length>0?Ne(g.__webglFramebuffer[0],S):Ne(g.__webglFramebuffer,S)}else if(P){g.__webglDepthbuffer=[];for(let z=0;z<6;z++)if(r.bindFramebuffer(e.FRAMEBUFFER,g.__webglFramebuffer[z]),g.__webglDepthbuffer[z]===void 0)g.__webglDepthbuffer[z]=e.createRenderbuffer(),Re(g.__webglDepthbuffer[z],S,!1);else{let W=S.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,F=g.__webglDepthbuffer[z];e.bindRenderbuffer(e.RENDERBUFFER,F),e.framebufferRenderbuffer(e.FRAMEBUFFER,W,e.RENDERBUFFER,F)}}else{let z=S.texture.mipmaps;if(z&&z.length>0?r.bindFramebuffer(e.FRAMEBUFFER,g.__webglFramebuffer[0]):r.bindFramebuffer(e.FRAMEBUFFER,g.__webglFramebuffer),g.__webglDepthbuffer===void 0)g.__webglDepthbuffer=e.createRenderbuffer(),Re(g.__webglDepthbuffer,S,!1);else{let W=S.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,F=g.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,F),e.framebufferRenderbuffer(e.FRAMEBUFFER,W,e.RENDERBUFFER,F)}}r.bindFramebuffer(e.FRAMEBUFFER,null)}function R(S,g,P){let z=i.get(S);g!==void 0&&he(z.__webglFramebuffer,S,S.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),P!==void 0&&je(S)}function it(S){let g=S.texture,P=i.get(S),z=i.get(g);S.addEventListener("dispose",A);let W=S.textures,F=S.isWebGLCubeRenderTarget===!0,ce=W.length>1;if(ce||(z.__webglTexture===void 0&&(z.__webglTexture=e.createTexture()),z.__version=g.version,s.memory.textures++),F){P.__webglFramebuffer=[];for(let te=0;te<6;te++)if(g.mipmaps&&g.mipmaps.length>0){P.__webglFramebuffer[te]=[];for(let ge=0;ge<g.mipmaps.length;ge++)P.__webglFramebuffer[te][ge]=e.createFramebuffer()}else P.__webglFramebuffer[te]=e.createFramebuffer()}else{if(g.mipmaps&&g.mipmaps.length>0){P.__webglFramebuffer=[];for(let te=0;te<g.mipmaps.length;te++)P.__webglFramebuffer[te]=e.createFramebuffer()}else P.__webglFramebuffer=e.createFramebuffer();if(ce)for(let te=0,ge=W.length;te<ge;te++){let Te=i.get(W[te]);Te.__webglTexture===void 0&&(Te.__webglTexture=e.createTexture(),s.memory.textures++)}if(S.samples>0&&Ae(S)===!1){P.__webglMultisampledFramebuffer=e.createFramebuffer(),P.__webglColorRenderbuffer=[],r.bindFramebuffer(e.FRAMEBUFFER,P.__webglMultisampledFramebuffer);for(let te=0;te<W.length;te++){let ge=W[te];P.__webglColorRenderbuffer[te]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,P.__webglColorRenderbuffer[te]);let Te=n.convert(ge.format,ge.colorSpace),Q=n.convert(ge.type),oe=M(ge.internalFormat,Te,Q,ge.colorSpace,S.isXRRenderTarget===!0),ie=Ee(S);e.renderbufferStorageMultisample(e.RENDERBUFFER,ie,oe,S.width,S.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+te,e.RENDERBUFFER,P.__webglColorRenderbuffer[te])}e.bindRenderbuffer(e.RENDERBUFFER,null),S.depthBuffer&&(P.__webglDepthRenderbuffer=e.createRenderbuffer(),Re(P.__webglDepthRenderbuffer,S,!0)),r.bindFramebuffer(e.FRAMEBUFFER,null)}}if(F){r.bindTexture(e.TEXTURE_CUBE_MAP,z.__webglTexture),Pe(e.TEXTURE_CUBE_MAP,g);for(let te=0;te<6;te++)if(g.mipmaps&&g.mipmaps.length>0)for(let ge=0;ge<g.mipmaps.length;ge++)he(P.__webglFramebuffer[te][ge],S,g,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+te,ge);else he(P.__webglFramebuffer[te],S,g,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+te,0);m(g)&&p(e.TEXTURE_CUBE_MAP),r.unbindTexture()}else if(ce){for(let te=0,ge=W.length;te<ge;te++){let Te=W[te],Q=i.get(Te),oe=e.TEXTURE_2D;(S.isWebGL3DRenderTarget||S.isWebGLArrayRenderTarget)&&(oe=S.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),r.bindTexture(oe,Q.__webglTexture),Pe(oe,Te),he(P.__webglFramebuffer,S,Te,e.COLOR_ATTACHMENT0+te,oe,0),m(Te)&&p(oe)}r.unbindTexture()}else{let te=e.TEXTURE_2D;if((S.isWebGL3DRenderTarget||S.isWebGLArrayRenderTarget)&&(te=S.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),r.bindTexture(te,z.__webglTexture),Pe(te,g),g.mipmaps&&g.mipmaps.length>0)for(let ge=0;ge<g.mipmaps.length;ge++)he(P.__webglFramebuffer[ge],S,g,e.COLOR_ATTACHMENT0,te,ge);else he(P.__webglFramebuffer,S,g,e.COLOR_ATTACHMENT0,te,0);m(g)&&p(te),r.unbindTexture()}S.depthBuffer&&je(S)}function Ve(S){let g=S.textures;for(let P=0,z=g.length;P<z;P++){let W=g[P];if(m(W)){let F=b(S),ce=i.get(W).__webglTexture;r.bindTexture(F,ce),p(F),r.unbindTexture()}}}let Ge=[],pe=[];function Ze(S){if(S.samples>0){if(Ae(S)===!1){let g=S.textures,P=S.width,z=S.height,W=e.COLOR_BUFFER_BIT,F=S.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,ce=i.get(S),te=g.length>1;if(te)for(let Te=0;Te<g.length;Te++)r.bindFramebuffer(e.FRAMEBUFFER,ce.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+Te,e.RENDERBUFFER,null),r.bindFramebuffer(e.FRAMEBUFFER,ce.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+Te,e.TEXTURE_2D,null,0);r.bindFramebuffer(e.READ_FRAMEBUFFER,ce.__webglMultisampledFramebuffer);let ge=S.texture.mipmaps;ge&&ge.length>0?r.bindFramebuffer(e.DRAW_FRAMEBUFFER,ce.__webglFramebuffer[0]):r.bindFramebuffer(e.DRAW_FRAMEBUFFER,ce.__webglFramebuffer);for(let Te=0;Te<g.length;Te++){if(S.resolveDepthBuffer&&(S.depthBuffer&&(W|=e.DEPTH_BUFFER_BIT),S.stencilBuffer&&S.resolveStencilBuffer&&(W|=e.STENCIL_BUFFER_BIT)),te){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,ce.__webglColorRenderbuffer[Te]);let Q=i.get(g[Te]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,Q,0)}e.blitFramebuffer(0,0,P,z,0,0,P,z,W,e.NEAREST),l===!0&&(Ge.length=0,pe.length=0,Ge.push(e.COLOR_ATTACHMENT0+Te),S.depthBuffer&&S.resolveDepthBuffer===!1&&(Ge.push(F),pe.push(F),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,pe)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,Ge))}if(r.bindFramebuffer(e.READ_FRAMEBUFFER,null),r.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),te)for(let Te=0;Te<g.length;Te++){r.bindFramebuffer(e.FRAMEBUFFER,ce.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+Te,e.RENDERBUFFER,ce.__webglColorRenderbuffer[Te]);let Q=i.get(g[Te]).__webglTexture;r.bindFramebuffer(e.FRAMEBUFFER,ce.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+Te,e.TEXTURE_2D,Q,0)}r.bindFramebuffer(e.DRAW_FRAMEBUFFER,ce.__webglMultisampledFramebuffer)}else if(S.depthBuffer&&S.resolveDepthBuffer===!1&&l){let g=S.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[g])}}}function Ee(S){return Math.min(a.maxSamples,S.samples)}function Ae(S){let g=i.get(S);return S.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&g.__useRenderToTexture!==!1}function nt(S){let g=s.render.frame;c.get(S)!==g&&(c.set(S,g),S.update())}function at(S,g){let P=S.colorSpace,z=S.format,W=S.type;return S.isCompressedTexture===!0||S.isVideoTexture===!0||P!==zr&&P!==cr&&(Xe.getTransfer(P)===Ye?(z!==Dt||W!==kt)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",P)),g}function ne(S){return typeof HTMLImageElement<"u"&&S instanceof HTMLImageElement?(h.width=S.naturalWidth||S.width,h.height=S.naturalHeight||S.height):typeof VideoFrame<"u"&&S instanceof VideoFrame?(h.width=S.displayWidth,h.height=S.displayHeight):(h.width=S.width,h.height=S.height),h}this.allocateTextureUnit=B,this.resetTextureUnits=V,this.setTexture2D=Y,this.setTexture2DArray=k,this.setTexture3D=$,this.setTextureCube=q,this.rebindTextures=R,this.setupRenderTarget=it,this.updateRenderTargetMipmap=Ve,this.updateMultisampleRenderTarget=Ze,this.setupDepthRenderbuffer=je,this.setupFrameBufferTexture=he,this.useMultisampledRTT=Ae}function Mm(e,t){function r(i,a=cr){let n,s=Xe.getTransfer(a);if(i===kt)return e.UNSIGNED_BYTE;if(i===Va)return e.UNSIGNED_SHORT_4_4_4_4;if(i===Ga)return e.UNSIGNED_SHORT_5_5_5_1;if(i===Rs)return e.UNSIGNED_INT_5_9_9_9_REV;if(i===ws)return e.BYTE;if(i===As)return e.SHORT;if(i===di)return e.UNSIGNED_SHORT;if(i===Ha)return e.INT;if(i===Er)return e.UNSIGNED_INT;if(i===$t)return e.FLOAT;if(i===pi)return e.HALF_FLOAT;if(i===Cs)return e.ALPHA;if(i===Ps)return e.RGB;if(i===Dt)return e.RGBA;if(i===mi)return e.DEPTH_COMPONENT;if(i===gi)return e.DEPTH_STENCIL;if(i===Us)return e.RED;if(i===ka)return e.RED_INTEGER;if(i===Ls)return e.RG;if(i===Wa)return e.RG_INTEGER;if(i===Xa)return e.RGBA_INTEGER;if(i===Bi||i===zi||i===Hi||i===Vi)if(s===Ye)if(n=t.get("WEBGL_compressed_texture_s3tc_srgb"),n!==null){if(i===Bi)return n.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===zi)return n.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Hi)return n.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Vi)return n.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(n=t.get("WEBGL_compressed_texture_s3tc"),n!==null){if(i===Bi)return n.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===zi)return n.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Hi)return n.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Vi)return n.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===ja||i===qa||i===Ya||i===Za)if(n=t.get("WEBGL_compressed_texture_pvrtc"),n!==null){if(i===ja)return n.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===qa)return n.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Ya)return n.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Za)return n.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Ka||i===Ja||i===$a)if(n=t.get("WEBGL_compressed_texture_etc"),n!==null){if(i===Ka||i===Ja)return s===Ye?n.COMPRESSED_SRGB8_ETC2:n.COMPRESSED_RGB8_ETC2;if(i===$a)return s===Ye?n.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:n.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===Qa||i===en||i===tn||i===rn||i===an||i===nn||i===sn||i===on||i===ln||i===hn||i===cn||i===un||i===dn||i===pn)if(n=t.get("WEBGL_compressed_texture_astc"),n!==null){if(i===Qa)return s===Ye?n.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:n.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===en)return s===Ye?n.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:n.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===tn)return s===Ye?n.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:n.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===rn)return s===Ye?n.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:n.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===an)return s===Ye?n.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:n.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===nn)return s===Ye?n.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:n.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===sn)return s===Ye?n.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:n.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===on)return s===Ye?n.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:n.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===ln)return s===Ye?n.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:n.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===hn)return s===Ye?n.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:n.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===cn)return s===Ye?n.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:n.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===un)return s===Ye?n.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:n.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===dn)return s===Ye?n.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:n.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===pn)return s===Ye?n.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:n.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Gi||i===fn||i===mn)if(n=t.get("EXT_texture_compression_bptc"),n!==null){if(i===Gi)return s===Ye?n.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:n.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===fn)return n.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===mn)return n.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Ds||i===gn||i===_n||i===vn)if(n=t.get("EXT_texture_compression_rgtc"),n!==null){if(i===Gi)return n.COMPRESSED_RED_RGTC1_EXT;if(i===gn)return n.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===_n)return n.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===vn)return n.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===fi?e.UNSIGNED_INT_24_8:e[i]!==void 0?e[i]:null}return{convert:r}}var rl=class extends It{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}},Sm=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Em=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Tm=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let r=new rl(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=r}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,r=new sr({vertexShader:Sm,fragmentShader:Em,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new bt(new Qn(20,20),r)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},bm=class extends Vr{constructor(e,t){super();let r=this,i=null,a=1,n=null,s="local-floor",o=1,l=null,h=null,c=null,u=null,d=null,f=null,x=new Tm,_={},m=t.getContextAttributes(),p=null,b=null,M=[],T=[],D=new we,w=null,A=new Ct;A.viewport=new ot;let O=new Ct;O.viewport=new ot;let E=[A,O],y=new Oc,U=null,V=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(j){let re=M[j];return re===void 0&&(re=new Xn,M[j]=re),re.getTargetRaySpace()},this.getControllerGrip=function(j){let re=M[j];return re===void 0&&(re=new Xn,M[j]=re),re.getGripSpace()},this.getHand=function(j){let re=M[j];return re===void 0&&(re=new Xn,M[j]=re),re.getHandSpace()};function B(j){let re=T.indexOf(j.inputSource);if(re===-1)return;let ye=M[re];ye!==void 0&&(ye.update(j.inputSource,j.frame,l||n),ye.dispatchEvent({type:j.type,data:j.inputSource}))}function X(){i.removeEventListener("select",B),i.removeEventListener("selectstart",B),i.removeEventListener("selectend",B),i.removeEventListener("squeeze",B),i.removeEventListener("squeezestart",B),i.removeEventListener("squeezeend",B),i.removeEventListener("end",X),i.removeEventListener("inputsourceschange",Y);for(let j=0;j<M.length;j++){let re=T[j];re!==null&&(T[j]=null,M[j].disconnect(re))}U=null,V=null,x.reset();for(let j in _)delete _[j];e.setRenderTarget(p),d=null,u=null,c=null,i=null,b=null,Fe.stop(),r.isPresenting=!1,e.setPixelRatio(w),e.setSize(D.width,D.height,!1),r.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(j){a=j,r.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(j){s=j,r.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||n},this.setReferenceSpace=function(j){l=j},this.getBaseLayer=function(){return u!==null?u:d},this.getBinding=function(){return c},this.getFrame=function(){return f},this.getSession=function(){return i},this.setSession=async function(j){if(i=j,i!==null){if(p=e.getRenderTarget(),i.addEventListener("select",B),i.addEventListener("selectstart",B),i.addEventListener("selectend",B),i.addEventListener("squeeze",B),i.addEventListener("squeezestart",B),i.addEventListener("squeezeend",B),i.addEventListener("end",X),i.addEventListener("inputsourceschange",Y),m.xrCompatible!==!0&&await t.makeXRCompatible(),w=e.getPixelRatio(),e.getSize(D),typeof XRWebGLBinding<"u"&&(c=new XRWebGLBinding(i,t)),c!==null&&"createProjectionLayer"in XRWebGLBinding.prototype){let re=null,ye=null,de=null;m.depth&&(de=m.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,re=m.stencil?gi:mi,ye=m.stencil?fi:Er);let he={colorFormat:t.RGBA8,depthFormat:de,scaleFactor:a};u=c.createProjectionLayer(he),i.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),b=new Tr(u.textureWidth,u.textureHeight,{format:Dt,type:kt,depthTexture:new _o(u.textureWidth,u.textureHeight,ye,void 0,void 0,void 0,void 0,void 0,void 0,re),stencilBuffer:m.stencil,colorSpace:e.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1})}else{let re={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:a};d=new XRWebGLLayer(i,t,re),i.updateRenderState({baseLayer:d}),e.setPixelRatio(1),e.setSize(d.framebufferWidth,d.framebufferHeight,!1),b=new Tr(d.framebufferWidth,d.framebufferHeight,{format:Dt,type:kt,colorSpace:e.outputColorSpace,stencilBuffer:m.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}b.isXRRenderTarget=!0,this.setFoveation(o),l=null,n=await i.requestReferenceSpace(s),Fe.setContext(i),Fe.start(),r.isPresenting=!0,r.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function Y(j){for(let re=0;re<j.removed.length;re++){let ye=j.removed[re],de=T.indexOf(ye);de>=0&&(T[de]=null,M[de].disconnect(ye))}for(let re=0;re<j.added.length;re++){let ye=j.added[re],de=T.indexOf(ye);if(de===-1){for(let Re=0;Re<M.length;Re++)if(Re>=T.length){T.push(ye),de=Re;break}else if(T[Re]===null){T[Re]=ye,de=Re;break}if(de===-1)break}let he=M[de];he&&he.connect(ye)}}let k=new L,$=new L;function q(j,re,ye){k.setFromMatrixPosition(re.matrixWorld),$.setFromMatrixPosition(ye.matrixWorld);let de=k.distanceTo($),he=re.projectionMatrix.elements,Re=ye.projectionMatrix.elements,Ne=he[14]/(he[10]-1),je=he[14]/(he[10]+1),R=(he[9]+1)/he[5],it=(he[9]-1)/he[5],Ve=(he[8]-1)/he[0],Ge=(Re[8]+1)/Re[0],pe=Ne*Ve,Ze=Ne*Ge,Ee=de/(-Ve+Ge),Ae=Ee*-Ve;if(re.matrixWorld.decompose(j.position,j.quaternion,j.scale),j.translateX(Ae),j.translateZ(Ee),j.matrixWorld.compose(j.position,j.quaternion,j.scale),j.matrixWorldInverse.copy(j.matrixWorld).invert(),he[10]===-1)j.projectionMatrix.copy(re.projectionMatrix),j.projectionMatrixInverse.copy(re.projectionMatrixInverse);else{let nt=Ne+Ee,at=je+Ee,ne=pe-Ae,S=Ze+(de-Ae),g=R*je/at*nt,P=it*je/at*nt;j.projectionMatrix.makePerspective(ne,S,g,P,nt,at),j.projectionMatrixInverse.copy(j.projectionMatrix).invert()}}function K(j,re){re===null?j.matrixWorld.copy(j.matrix):j.matrixWorld.multiplyMatrices(re.matrixWorld,j.matrix),j.matrixWorldInverse.copy(j.matrixWorld).invert()}this.updateCamera=function(j){if(i===null)return;let re=j.near,ye=j.far;x.texture!==null&&(x.depthNear>0&&(re=x.depthNear),x.depthFar>0&&(ye=x.depthFar)),y.near=O.near=A.near=re,y.far=O.far=A.far=ye,(U!==y.near||V!==y.far)&&(i.updateRenderState({depthNear:y.near,depthFar:y.far}),U=y.near,V=y.far),y.layers.mask=j.layers.mask|6,A.layers.mask=y.layers.mask&3,O.layers.mask=y.layers.mask&5;let de=j.parent,he=y.cameras;K(y,de);for(let Re=0;Re<he.length;Re++)K(he[Re],de);he.length===2?q(y,A,O):y.projectionMatrix.copy(A.projectionMatrix),me(j,y,de)};function me(j,re,ye){ye===null?j.matrix.copy(re.matrixWorld):(j.matrix.copy(ye.matrixWorld),j.matrix.invert(),j.matrix.multiply(re.matrixWorld)),j.matrix.decompose(j.position,j.quaternion,j.scale),j.updateMatrixWorld(!0),j.projectionMatrix.copy(re.projectionMatrix),j.projectionMatrixInverse.copy(re.projectionMatrixInverse),j.isPerspectiveCamera&&(j.fov=vi*2*Math.atan(1/j.projectionMatrix.elements[5]),j.zoom=1)}this.getCamera=function(){return y},this.getFoveation=function(){if(!(u===null&&d===null))return o},this.setFoveation=function(j){o=j,u!==null&&(u.fixedFoveation=j),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=j)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(y)},this.getCameraTexture=function(j){return _[j]};let De=null;function Pe(j,re){if(h=re.getViewerPose(l||n),f=re,h!==null){let ye=h.views;d!==null&&(e.setRenderTargetFramebuffer(b,d.framebuffer),e.setRenderTarget(b));let de=!1;ye.length!==y.cameras.length&&(y.cameras.length=0,de=!0);for(let Re=0;Re<ye.length;Re++){let Ne=ye[Re],je=null;if(d!==null)je=d.getViewport(Ne);else{let it=c.getViewSubImage(u,Ne);je=it.viewport,Re===0&&(e.setRenderTargetTextures(b,it.colorTexture,it.depthStencilTexture),e.setRenderTarget(b))}let R=E[Re];R===void 0&&(R=new Ct,R.layers.enable(Re),R.viewport=new ot,E[Re]=R),R.matrix.fromArray(Ne.transform.matrix),R.matrix.decompose(R.position,R.quaternion,R.scale),R.projectionMatrix.fromArray(Ne.projectionMatrix),R.projectionMatrixInverse.copy(R.projectionMatrix).invert(),R.viewport.set(je.x,je.y,je.width,je.height),Re===0&&(y.matrix.copy(R.matrix),y.matrix.decompose(y.position,y.quaternion,y.scale)),de===!0&&y.cameras.push(R)}let he=i.enabledFeatures;if(he&&he.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&c){let Re=c.getDepthInformation(ye[0]);Re&&Re.isValid&&Re.texture&&x.init(Re,i.renderState)}if(he&&he.includes("camera-access")&&(e.state.unbindTexture(),c))for(let Re=0;Re<ye.length;Re++){let Ne=ye[Re].camera;if(Ne){let je=_[Ne];je||(je=new rl,_[Ne]=je);let R=c.getCameraImage(Ne);je.sourceTexture=R}}}for(let ye=0;ye<M.length;ye++){let de=T[ye],he=M[ye];de!==null&&he!==void 0&&he.update(de,re,l||n)}De&&De(j,re),re.detectedPlanes&&r.dispatchEvent({type:"planesdetected",data:re}),f=null}let Fe=new Ao;Fe.setAnimationLoop(Pe),this.setAnimationLoop=function(j){De=j},this.dispose=function(){}}},Dr=new mr,wm=new ht;function Am(e,t){function r(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function i(m,p){p.color.getRGB(m.fogColor.value,co(e)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function a(m,p,b,M,T){p.isMeshBasicMaterial||p.isMeshLambertMaterial?n(m,p):p.isMeshToonMaterial?(n(m,p),u(m,p)):p.isMeshPhongMaterial?(n(m,p),c(m,p)):p.isMeshStandardMaterial?(n(m,p),d(m,p),p.isMeshPhysicalMaterial&&f(m,p,T)):p.isMeshMatcapMaterial?(n(m,p),x(m,p)):p.isMeshDepthMaterial?n(m,p):p.isMeshDistanceMaterial?(n(m,p),_(m,p)):p.isMeshNormalMaterial?n(m,p):p.isLineBasicMaterial?(s(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?l(m,p,b,M):p.isSpriteMaterial?h(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function n(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,r(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,r(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,r(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===xt&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,r(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===xt&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,r(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,r(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,r(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);let b=t.get(p),M=b.envMap,T=b.envMapRotation;M&&(m.envMap.value=M,Dr.copy(T),Dr.x*=-1,Dr.y*=-1,Dr.z*=-1,M.isCubeTexture&&M.isRenderTargetTexture===!1&&(Dr.y*=-1,Dr.z*=-1),m.envMapRotation.value.setFromMatrix4(wm.makeRotationFromEuler(Dr)),m.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,r(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,r(p.aoMap,m.aoMapTransform))}function s(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,r(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,b,M){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*b,m.scale.value=M*.5,p.map&&(m.map.value=p.map,r(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,r(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,r(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,r(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function u(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function d(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,r(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,r(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,b){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,r(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,r(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,r(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,r(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,r(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===xt&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,r(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,r(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=b.texture,m.transmissionSamplerSize.value.set(b.width,b.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,r(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,r(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,r(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,r(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,r(p.specularIntensityMap,m.specularIntensityMapTransform))}function x(m,p){p.matcap&&(m.matcap.value=p.matcap)}function _(m,p){let b=t.get(p).light;m.referencePosition.value.setFromMatrixPosition(b.matrixWorld),m.nearDistance.value=b.shadow.camera.near,m.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:a}}function Rm(e,t,r,i){let a={},n={},s=[],o=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function l(b,M){let T=M.program;i.uniformBlockBinding(b,T)}function h(b,M){let T=a[b.id];T===void 0&&(x(b),T=c(b),a[b.id]=T,b.addEventListener("dispose",m));let D=M.program;i.updateUBOMapping(b,D);let w=t.render.frame;n[b.id]!==w&&(d(b),n[b.id]=w)}function c(b){let M=u();b.__bindingPointIndex=M;let T=e.createBuffer(),D=b.__size,w=b.usage;return e.bindBuffer(e.UNIFORM_BUFFER,T),e.bufferData(e.UNIFORM_BUFFER,D,w),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,M,T),T}function u(){for(let b=0;b<o;b++)if(s.indexOf(b)===-1)return s.push(b),b;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(b){let M=a[b.id],T=b.uniforms,D=b.__cache;e.bindBuffer(e.UNIFORM_BUFFER,M);for(let w=0,A=T.length;w<A;w++){let O=Array.isArray(T[w])?T[w]:[T[w]];for(let E=0,y=O.length;E<y;E++){let U=O[E];if(f(U,w,E,D)===!0){let V=U.__offset,B=Array.isArray(U.value)?U.value:[U.value],X=0;for(let Y=0;Y<B.length;Y++){let k=B[Y],$=_(k);typeof k=="number"||typeof k=="boolean"?(U.__data[0]=k,e.bufferSubData(e.UNIFORM_BUFFER,V+X,U.__data)):k.isMatrix3?(U.__data[0]=k.elements[0],U.__data[1]=k.elements[1],U.__data[2]=k.elements[2],U.__data[3]=0,U.__data[4]=k.elements[3],U.__data[5]=k.elements[4],U.__data[6]=k.elements[5],U.__data[7]=0,U.__data[8]=k.elements[6],U.__data[9]=k.elements[7],U.__data[10]=k.elements[8],U.__data[11]=0):(k.toArray(U.__data,X),X+=$.storage/Float32Array.BYTES_PER_ELEMENT)}e.bufferSubData(e.UNIFORM_BUFFER,V,U.__data)}}}e.bindBuffer(e.UNIFORM_BUFFER,null)}function f(b,M,T,D){let w=b.value,A=M+"_"+T;if(D[A]===void 0)return typeof w=="number"||typeof w=="boolean"?D[A]=w:D[A]=w.clone(),!0;{let O=D[A];if(typeof w=="number"||typeof w=="boolean"){if(O!==w)return D[A]=w,!0}else if(O.equals(w)===!1)return O.copy(w),!0}return!1}function x(b){let M=b.uniforms,T=0,D=16;for(let A=0,O=M.length;A<O;A++){let E=Array.isArray(M[A])?M[A]:[M[A]];for(let y=0,U=E.length;y<U;y++){let V=E[y],B=Array.isArray(V.value)?V.value:[V.value];for(let X=0,Y=B.length;X<Y;X++){let k=B[X],$=_(k),q=T%D,K=q%$.boundary,me=q+K;T+=K,me!==0&&D-me<$.storage&&(T+=D-me),V.__data=new Float32Array($.storage/Float32Array.BYTES_PER_ELEMENT),V.__offset=T,T+=$.storage}}}let w=T%D;return w>0&&(T+=D-w),b.__size=T,b.__cache={},this}function _(b){let M={boundary:0,storage:0};return typeof b=="number"||typeof b=="boolean"?(M.boundary=4,M.storage=4):b.isVector2?(M.boundary=8,M.storage=8):b.isVector3||b.isColor?(M.boundary=16,M.storage=12):b.isVector4?(M.boundary=16,M.storage=16):b.isMatrix3?(M.boundary=48,M.storage=48):b.isMatrix4?(M.boundary=64,M.storage=64):b.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",b),M}function m(b){let M=b.target;M.removeEventListener("dispose",m);let T=s.indexOf(M.__bindingPointIndex);s.splice(T,1),e.deleteBuffer(a[M.id]),delete a[M.id],delete n[M.id]}function p(){for(let b in a)e.deleteBuffer(a[b]);s=[],a={},n={}}return{bind:l,update:h,dispose:p}}var Cm=class{constructor(e={}){let{canvas:t=bh(),context:r=null,depth:i=!0,stencil:a=!1,alpha:n=!1,antialias:s=!1,premultipliedAlpha:o=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:c=!1,reversedDepthBuffer:u=!1}=e;this.isWebGLRenderer=!0;let d;if(r!==null){if(typeof WebGLRenderingContext<"u"&&r instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=r.getContextAttributes().alpha}else d=n;let f=new Uint32Array(4),x=new Int32Array(4),_=null,m=null,p=[],b=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=hr,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let M=this,T=!1;this._outputColorSpace=yt;let D=0,w=0,A=null,O=-1,E=null,y=new ot,U=new ot,V=null,B=new We(0),X=0,Y=t.width,k=t.height,$=1,q=null,K=null,me=new ot(0,0,Y,k),De=new ot(0,0,Y,k),Pe=!1,Fe=new qn,j=!1,re=!1,ye=new ht,de=new L,he=new ot,Re={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Ne=!1;function je(){return A===null?$:1}let R=r;function it(v,N){return t.getContext(v,N)}try{let v={alpha:!0,depth:i,stencil:a,antialias:s,premultipliedAlpha:o,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:c};if("setAttribute"in t&&t.setAttribute("data-engine","three.js r179"),t.addEventListener("webglcontextlost",le,!1),t.addEventListener("webglcontextrestored",ae,!1),t.addEventListener("webglcontextcreationerror",Se,!1),R===null){let N="webgl2";if(R=it(N,v),R===null)throw it(N)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(v){throw console.error("THREE.WebGLRenderer: "+v.message),v}let Ve,Ge,pe,Ze,Ee,Ae,nt,at,ne,S,g,P,z,W,F,ce,te,ge,Te,Q,oe,ie,Me,ue;function Oe(){Ve=new Bp(R),Ve.init(),ie=new Mm(R,Ve),Ge=new Up(R,Ve,e,ie),pe=new xm(R,Ve),Ge.reversedDepthBuffer&&u&&pe.buffers.depth.setReversed(!0),Ze=new Vp(R),Ee=new sm,Ae=new ym(R,Ve,pe,Ee,Ge,ie,Ze),nt=new Dp(M),at=new Fp(M),ne=new qc(R),Me=new Cp(R,ne),S=new zp(R,ne,Ze,Me),g=new kp(R,S,ne,Ze),Te=new Gp(R,Ge,Ae),ce=new Lp(Ee),P=new nm(M,nt,at,Ve,Ge,Me,ce),z=new Am(M,Ee),W=new lm,F=new fm(Ve),ge=new Rp(M,nt,at,pe,g,d,o),te=new _m(M,g,Ge),ue=new Rm(R,Ze,Ge,pe),Q=new Pp(R,Ve,Ze),oe=new Hp(R,Ve,Ze),Ze.programs=P.programs,M.capabilities=Ge,M.extensions=Ve,M.properties=Ee,M.renderLists=W,M.shadowMap=te,M.state=pe,M.info=Ze}Oe();let C=new bm(M,R);this.xr=C,this.getContext=function(){return R},this.getContextAttributes=function(){return R.getContextAttributes()},this.forceContextLoss=function(){let v=Ve.get("WEBGL_lose_context");v&&v.loseContext()},this.forceContextRestore=function(){let v=Ve.get("WEBGL_lose_context");v&&v.restoreContext()},this.getPixelRatio=function(){return $},this.setPixelRatio=function(v){v!==void 0&&($=v,this.setSize(Y,k,!1))},this.getSize=function(v){return v.set(Y,k)},this.setSize=function(v,N,H=!0){if(C.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}Y=v,k=N,t.width=Math.floor(v*$),t.height=Math.floor(N*$),H===!0&&(t.style.width=v+"px",t.style.height=N+"px"),this.setViewport(0,0,v,N)},this.getDrawingBufferSize=function(v){return v.set(Y*$,k*$).floor()},this.setDrawingBufferSize=function(v,N,H){Y=v,k=N,$=H,t.width=Math.floor(v*H),t.height=Math.floor(N*H),this.setViewport(0,0,v,N)},this.getCurrentViewport=function(v){return v.copy(y)},this.getViewport=function(v){return v.copy(me)},this.setViewport=function(v,N,H,G){v.isVector4?me.set(v.x,v.y,v.z,v.w):me.set(v,N,H,G),pe.viewport(y.copy(me).multiplyScalar($).round())},this.getScissor=function(v){return v.copy(De)},this.setScissor=function(v,N,H,G){v.isVector4?De.set(v.x,v.y,v.z,v.w):De.set(v,N,H,G),pe.scissor(U.copy(De).multiplyScalar($).round())},this.getScissorTest=function(){return Pe},this.setScissorTest=function(v){pe.setScissorTest(Pe=v)},this.setOpaqueSort=function(v){q=v},this.setTransparentSort=function(v){K=v},this.getClearColor=function(v){return v.copy(ge.getClearColor())},this.setClearColor=function(){ge.setClearColor(...arguments)},this.getClearAlpha=function(){return ge.getClearAlpha()},this.setClearAlpha=function(){ge.setClearAlpha(...arguments)},this.clear=function(v=!0,N=!0,H=!0){let G=0;if(v){let I=!1;if(A!==null){let J=A.texture.format;I=J===Xa||J===Wa||J===ka}if(I){let J=A.texture.type,fe=J===kt||J===Er||J===di||J===fi||J===Va||J===Ga,_e=ge.getClearColor(),ve=ge.getClearAlpha(),Ue=_e.r,Ie=_e.g,Le=_e.b;fe?(f[0]=Ue,f[1]=Ie,f[2]=Le,f[3]=ve,R.clearBufferuiv(R.COLOR,0,f)):(x[0]=Ue,x[1]=Ie,x[2]=Le,x[3]=ve,R.clearBufferiv(R.COLOR,0,x))}else G|=R.COLOR_BUFFER_BIT}N&&(G|=R.DEPTH_BUFFER_BIT),H&&(G|=R.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),R.clear(G)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",le,!1),t.removeEventListener("webglcontextrestored",ae,!1),t.removeEventListener("webglcontextcreationerror",Se,!1),ge.dispose(),W.dispose(),F.dispose(),Ee.dispose(),nt.dispose(),at.dispose(),g.dispose(),Me.dispose(),ue.dispose(),P.dispose(),C.dispose(),C.removeEventListener("sessionstart",Ht),C.removeEventListener("sessionend",Vt),vr.stop()};function le(v){v.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),T=!0}function ae(){console.log("THREE.WebGLRenderer: Context Restored."),T=!1;let v=Ze.autoReset,N=te.enabled,H=te.autoUpdate,G=te.needsUpdate,I=te.type;Oe(),Ze.autoReset=v,te.enabled=N,te.autoUpdate=H,te.needsUpdate=G,te.type=I}function Se(v){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",v.statusMessage)}function ee(v){let N=v.target;N.removeEventListener("dispose",ee),Z(N)}function Z(v){xe(v),Ee.remove(v)}function xe(v){let N=Ee.get(v).programs;N!==void 0&&(N.forEach(function(H){P.releaseProgram(H)}),v.isShaderMaterial&&P.releaseShaderCache(v))}this.renderBufferDirect=function(v,N,H,G,I,J){N===null&&(N=Re);let fe=I.isMesh&&I.matrixWorld.determinant()<0,_e=_l(v,N,H,G,I);pe.setMaterial(G,fe);let ve=H.index,Ue=1;if(G.wireframe===!0){if(ve=S.getWireframeAttribute(H),ve===void 0)return;Ue=2}let Ie=H.drawRange,Le=H.attributes.position,ke=Ie.start*Ue,Ke=(Ie.start+Ie.count)*Ue;J!==null&&(ke=Math.max(ke,J.start*Ue),Ke=Math.min(Ke,(J.start+J.count)*Ue)),ve!==null?(ke=Math.max(ke,0),Ke=Math.min(Ke,ve.count)):Le!=null&&(ke=Math.max(ke,0),Ke=Math.min(Ke,Le.count));let $e=Ke-ke;if($e<0||$e===1/0)return;Me.setup(I,G,_e,H,ve);let et,Je=Q;if(ve!==null&&(et=ne.get(ve),Je=oe,Je.setIndex(et)),I.isMesh)G.wireframe===!0?(pe.setLineWidth(G.wireframeLinewidth*je()),Je.setMode(R.LINES)):Je.setMode(R.TRIANGLES);else if(I.isLine){let be=G.linewidth;be===void 0&&(be=1),pe.setLineWidth(be*je()),I.isLineSegments?Je.setMode(R.LINES):I.isLineLoop?Je.setMode(R.LINE_LOOP):Je.setMode(R.LINE_STRIP)}else I.isPoints?Je.setMode(R.POINTS):I.isSprite&&Je.setMode(R.TRIANGLES);if(I.isBatchedMesh)if(I._multiDrawInstances!==null)Xr("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),Je.renderMultiDrawInstances(I._multiDrawStarts,I._multiDrawCounts,I._multiDrawCount,I._multiDrawInstances);else if(Ve.get("WEBGL_multi_draw"))Je.renderMultiDraw(I._multiDrawStarts,I._multiDrawCounts,I._multiDrawCount);else{let be=I._multiDrawStarts,pt=I._multiDrawCounts,Zt=I._multiDrawCount,Pt=ve?ne.get(ve).bytesPerElement:1,Ir=Ee.get(G).currentProgram.getUniforms();for(let Mt=0;Mt<Zt;Mt++)Ir.setValue(R,"_gl_DrawID",Mt),Je.render(be[Mt]/Pt,pt[Mt])}else if(I.isInstancedMesh)Je.renderInstances(ke,$e,I.count);else if(H.isInstancedBufferGeometry){let be=H._maxInstanceCount!==void 0?H._maxInstanceCount:1/0,pt=Math.min(H.instanceCount,be);Je.renderInstances(ke,$e,pt)}else Je.render(ke,$e)};function Ce(v,N,H){v.transparent===!0&&v.side===Jt&&v.forceSinglePass===!1?(v.side=xt,v.needsUpdate=!0,Ii(v,N,H),v.side=or,v.needsUpdate=!0,Ii(v,N,H),v.side=Jt):Ii(v,N,H)}this.compile=function(v,N,H=null){H===null&&(H=v),m=F.get(H),m.init(N),b.push(m),H.traverseVisible(function(I){I.isLight&&I.layers.test(N.layers)&&(m.pushLight(I),I.castShadow&&m.pushShadow(I))}),v!==H&&v.traverseVisible(function(I){I.isLight&&I.layers.test(N.layers)&&(m.pushLight(I),I.castShadow&&m.pushShadow(I))}),m.setupLights();let G=new Set;return v.traverse(function(I){if(!(I.isMesh||I.isPoints||I.isLine||I.isSprite))return;let J=I.material;if(J)if(Array.isArray(J))for(let fe=0;fe<J.length;fe++){let _e=J[fe];Ce(_e,H,I),G.add(_e)}else Ce(J,H,I),G.add(J)}),m=b.pop(),G},this.compileAsync=function(v,N,H=null){let G=this.compile(v,N,H);return new Promise(I=>{function J(){if(G.forEach(function(fe){Ee.get(fe).currentProgram.isReady()&&G.delete(fe)}),G.size===0){I(v);return}setTimeout(J,10)}Ve.get("KHR_parallel_shader_compile")!==null?J():setTimeout(J,10)})};let st=null;function qe(v){st&&st(v)}function Ht(){vr.stop()}function Vt(){vr.start()}let vr=new Ao;vr.setAnimationLoop(qe),typeof self<"u"&&vr.setContext(self),this.setAnimationLoop=function(v){st=v,C.setAnimationLoop(v),v===null?vr.stop():vr.start()},C.addEventListener("sessionstart",Ht),C.addEventListener("sessionend",Vt),this.render=function(v,N){if(N!==void 0&&N.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(T===!0)return;if(v.matrixWorldAutoUpdate===!0&&v.updateMatrixWorld(),N.parent===null&&N.matrixWorldAutoUpdate===!0&&N.updateMatrixWorld(),C.enabled===!0&&C.isPresenting===!0&&(C.cameraAutoUpdate===!0&&C.updateCamera(N),N=C.getCamera()),v.isScene===!0&&v.onBeforeRender(M,v,N,A),m=F.get(v,b.length),m.init(N),b.push(m),ye.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),Fe.setFromProjectionMatrix(ye,Wt,N.reversedDepth),re=this.localClippingEnabled,j=ce.init(this.clippingPlanes,re),_=W.get(v,p.length),_.init(),p.push(_),C.enabled===!0&&C.isPresenting===!0){let J=M.xr.getDepthSensingMesh();J!==null&&Ta(J,N,-1/0,M.sortObjects)}Ta(v,N,0,M.sortObjects),_.finish(),M.sortObjects===!0&&_.sort(q,K),Ne=C.enabled===!1||C.isPresenting===!1||C.hasDepthSensing()===!1,Ne&&ge.addToRenderList(_,v),this.info.render.frame++,j===!0&&ce.beginShadows();let H=m.state.shadowsArray;te.render(H,v,N),j===!0&&ce.endShadows(),this.info.autoReset===!0&&this.info.reset();let G=_.opaque,I=_.transmissive;if(m.setupLights(),N.isArrayCamera){let J=N.cameras;if(I.length>0)for(let fe=0,_e=J.length;fe<_e;fe++){let ve=J[fe];ms(G,I,v,ve)}Ne&&ge.render(v);for(let fe=0,_e=J.length;fe<_e;fe++){let ve=J[fe];fs(_,v,ve,ve.viewport)}}else I.length>0&&ms(G,I,v,N),Ne&&ge.render(v),fs(_,v,N);A!==null&&w===0&&(Ae.updateMultisampleRenderTarget(A),Ae.updateRenderTargetMipmap(A)),v.isScene===!0&&v.onAfterRender(M,v,N),Me.resetDefaultState(),O=-1,E=null,b.pop(),b.length>0?(m=b[b.length-1],j===!0&&ce.setGlobalState(M.clippingPlanes,m.state.camera)):m=null,p.pop(),p.length>0?_=p[p.length-1]:_=null};function Ta(v,N,H,G){if(v.visible===!1)return;if(v.layers.test(N.layers)){if(v.isGroup)H=v.renderOrder;else if(v.isLOD)v.autoUpdate===!0&&v.update(N);else if(v.isLight)m.pushLight(v),v.castShadow&&m.pushShadow(v);else if(v.isSprite){if(!v.frustumCulled||Fe.intersectsSprite(v)){G&&he.setFromMatrixPosition(v.matrixWorld).applyMatrix4(ye);let J=g.update(v),fe=v.material;fe.visible&&_.push(v,J,fe,H,he.z,null)}}else if((v.isMesh||v.isLine||v.isPoints)&&(!v.frustumCulled||Fe.intersectsObject(v))){let J=g.update(v),fe=v.material;if(G&&(v.boundingSphere!==void 0?(v.boundingSphere===null&&v.computeBoundingSphere(),he.copy(v.boundingSphere.center)):(J.boundingSphere===null&&J.computeBoundingSphere(),he.copy(J.boundingSphere.center)),he.applyMatrix4(v.matrixWorld).applyMatrix4(ye)),Array.isArray(fe)){let _e=J.groups;for(let ve=0,Ue=_e.length;ve<Ue;ve++){let Ie=_e[ve],Le=fe[Ie.materialIndex];Le&&Le.visible&&_.push(v,J,Le,H,he.z,Ie)}}else fe.visible&&_.push(v,J,fe,H,he.z,null)}}let I=v.children;for(let J=0,fe=I.length;J<fe;J++)Ta(I[J],N,H,G)}function fs(v,N,H,G){let I=v.opaque,J=v.transmissive,fe=v.transparent;m.setupLightsView(H),j===!0&&ce.setGlobalState(M.clippingPlanes,H),G&&pe.viewport(y.copy(G)),I.length>0&&Di(I,N,H),J.length>0&&Di(J,N,H),fe.length>0&&Di(fe,N,H),pe.buffers.depth.setTest(!0),pe.buffers.depth.setMask(!0),pe.buffers.color.setMask(!0),pe.setPolygonOffset(!1)}function ms(v,N,H,G){if((H.isScene===!0?H.overrideMaterial:null)!==null)return;m.state.transmissionRenderTarget[G.id]===void 0&&(m.state.transmissionRenderTarget[G.id]=new Tr(1,1,{generateMipmaps:!0,type:Ve.has("EXT_color_buffer_half_float")||Ve.has("EXT_color_buffer_float")?pi:kt,minFilter:Sr,samples:4,stencilBuffer:a,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Xe.workingColorSpace}));let I=m.state.transmissionRenderTarget[G.id],J=G.viewport||y;I.setSize(J.z*M.transmissionResolutionScale,J.w*M.transmissionResolutionScale);let fe=M.getRenderTarget(),_e=M.getActiveCubeFace(),ve=M.getActiveMipmapLevel();M.setRenderTarget(I),M.getClearColor(B),X=M.getClearAlpha(),X<1&&M.setClearColor(16777215,.5),M.clear(),Ne&&ge.render(H);let Ue=M.toneMapping;M.toneMapping=hr;let Ie=G.viewport;if(G.viewport!==void 0&&(G.viewport=void 0),m.setupLightsView(G),j===!0&&ce.setGlobalState(M.clippingPlanes,G),Di(v,H,G),Ae.updateMultisampleRenderTarget(I),Ae.updateRenderTargetMipmap(I),Ve.has("WEBGL_multisampled_render_to_texture")===!1){let Le=!1;for(let ke=0,Ke=N.length;ke<Ke;ke++){let $e=N[ke],et=$e.object,Je=$e.geometry,be=$e.material,pt=$e.group;if(be.side===Jt&&et.layers.test(G.layers)){let Zt=be.side;be.side=xt,be.needsUpdate=!0,gs(et,H,G,Je,be,pt),be.side=Zt,be.needsUpdate=!0,Le=!0}}Le===!0&&(Ae.updateMultisampleRenderTarget(I),Ae.updateRenderTargetMipmap(I))}M.setRenderTarget(fe,_e,ve),M.setClearColor(B,X),Ie!==void 0&&(G.viewport=Ie),M.toneMapping=Ue}function Di(v,N,H){let G=N.isScene===!0?N.overrideMaterial:null;for(let I=0,J=v.length;I<J;I++){let fe=v[I],_e=fe.object,ve=fe.geometry,Ue=fe.group,Ie=fe.material;Ie.allowOverride===!0&&G!==null&&(Ie=G),_e.layers.test(H.layers)&&gs(_e,N,H,ve,Ie,Ue)}}function gs(v,N,H,G,I,J){v.onBeforeRender(M,N,H,G,I,J),v.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,v.matrixWorld),v.normalMatrix.getNormalMatrix(v.modelViewMatrix),I.onBeforeRender(M,N,H,G,v,J),I.transparent===!0&&I.side===Jt&&I.forceSinglePass===!1?(I.side=xt,I.needsUpdate=!0,M.renderBufferDirect(H,N,G,I,v,J),I.side=or,I.needsUpdate=!0,M.renderBufferDirect(H,N,G,I,v,J),I.side=Jt):M.renderBufferDirect(H,N,G,I,v,J),v.onAfterRender(M,N,H,G,I,J)}function Ii(v,N,H){N.isScene!==!0&&(N=Re);let G=Ee.get(v),I=m.state.lights,J=m.state.shadowsArray,fe=I.state.version,_e=P.getParameters(v,I.state,J,N,H),ve=P.getProgramCacheKey(_e),Ue=G.programs;G.environment=v.isMeshStandardMaterial?N.environment:null,G.fog=N.fog,G.envMap=(v.isMeshStandardMaterial?at:nt).get(v.envMap||G.environment),G.envMapRotation=G.environment!==null&&v.envMap===null?N.environmentRotation:v.envMapRotation,Ue===void 0&&(v.addEventListener("dispose",ee),Ue=new Map,G.programs=Ue);let Ie=Ue.get(ve);if(Ie!==void 0){if(G.currentProgram===Ie&&G.lightsStateVersion===fe)return vs(v,_e),Ie}else _e.uniforms=P.getUniforms(v),v.onBeforeCompile(_e,M),Ie=P.acquireProgram(_e,ve),Ue.set(ve,Ie),G.uniforms=_e.uniforms;let Le=G.uniforms;return(!v.isShaderMaterial&&!v.isRawShaderMaterial||v.clipping===!0)&&(Le.clippingPlanes=ce.uniform),vs(v,_e),G.needsLights=xl(v),G.lightsStateVersion=fe,G.needsLights&&(Le.ambientLightColor.value=I.state.ambient,Le.lightProbe.value=I.state.probe,Le.directionalLights.value=I.state.directional,Le.directionalLightShadows.value=I.state.directionalShadow,Le.spotLights.value=I.state.spot,Le.spotLightShadows.value=I.state.spotShadow,Le.rectAreaLights.value=I.state.rectArea,Le.ltc_1.value=I.state.rectAreaLTC1,Le.ltc_2.value=I.state.rectAreaLTC2,Le.pointLights.value=I.state.point,Le.pointLightShadows.value=I.state.pointShadow,Le.hemisphereLights.value=I.state.hemi,Le.directionalShadowMap.value=I.state.directionalShadowMap,Le.directionalShadowMatrix.value=I.state.directionalShadowMatrix,Le.spotShadowMap.value=I.state.spotShadowMap,Le.spotLightMatrix.value=I.state.spotLightMatrix,Le.spotLightMap.value=I.state.spotLightMap,Le.pointShadowMap.value=I.state.pointShadowMap,Le.pointShadowMatrix.value=I.state.pointShadowMatrix),G.currentProgram=Ie,G.uniformsList=null,Ie}function _s(v){if(v.uniformsList===null){let N=v.currentProgram.getUniforms();v.uniformsList=ya.seqWithValue(N.seq,v.uniforms)}return v.uniformsList}function vs(v,N){let H=Ee.get(v);H.outputColorSpace=N.outputColorSpace,H.batching=N.batching,H.batchingColor=N.batchingColor,H.instancing=N.instancing,H.instancingColor=N.instancingColor,H.instancingMorph=N.instancingMorph,H.skinning=N.skinning,H.morphTargets=N.morphTargets,H.morphNormals=N.morphNormals,H.morphColors=N.morphColors,H.morphTargetsCount=N.morphTargetsCount,H.numClippingPlanes=N.numClippingPlanes,H.numIntersection=N.numClipIntersection,H.vertexAlphas=N.vertexAlphas,H.vertexTangents=N.vertexTangents,H.toneMapping=N.toneMapping}function _l(v,N,H,G,I){N.isScene!==!0&&(N=Re),Ae.resetTextureUnits();let J=N.fog,fe=G.isMeshStandardMaterial?N.environment:null,_e=A===null?M.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:zr,ve=(G.isMeshStandardMaterial?at:nt).get(G.envMap||fe),Ue=G.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,Ie=!!H.attributes.tangent&&(!!G.normalMap||G.anisotropy>0),Le=!!H.morphAttributes.position,ke=!!H.morphAttributes.normal,Ke=!!H.morphAttributes.color,$e=hr;G.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&($e=M.toneMapping);let et=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,Je=et!==void 0?et.length:0,be=Ee.get(G),pt=m.state.lights;if(j===!0&&(re===!0||v!==E)){let ft=v===E&&G.id===O;ce.setState(G,v,ft)}let Zt=!1;G.version===be.__version?(be.needsLights&&be.lightsStateVersion!==pt.state.version||be.outputColorSpace!==_e||I.isBatchedMesh&&be.batching===!1||!I.isBatchedMesh&&be.batching===!0||I.isBatchedMesh&&be.batchingColor===!0&&I.colorTexture===null||I.isBatchedMesh&&be.batchingColor===!1&&I.colorTexture!==null||I.isInstancedMesh&&be.instancing===!1||!I.isInstancedMesh&&be.instancing===!0||I.isSkinnedMesh&&be.skinning===!1||!I.isSkinnedMesh&&be.skinning===!0||I.isInstancedMesh&&be.instancingColor===!0&&I.instanceColor===null||I.isInstancedMesh&&be.instancingColor===!1&&I.instanceColor!==null||I.isInstancedMesh&&be.instancingMorph===!0&&I.morphTexture===null||I.isInstancedMesh&&be.instancingMorph===!1&&I.morphTexture!==null||be.envMap!==ve||G.fog===!0&&be.fog!==J||be.numClippingPlanes!==void 0&&(be.numClippingPlanes!==ce.numPlanes||be.numIntersection!==ce.numIntersection)||be.vertexAlphas!==Ue||be.vertexTangents!==Ie||be.morphTargets!==Le||be.morphNormals!==ke||be.morphColors!==Ke||be.toneMapping!==$e||be.morphTargetsCount!==Je)&&(Zt=!0):(Zt=!0,be.__version=G.version);let Pt=be.currentProgram;Zt===!0&&(Pt=Ii(G,N,I));let Ir=!1,Mt=!1,ui=!1,tt=Pt.getUniforms(),wt=be.uniforms;if(pe.useProgram(Pt.program)&&(Ir=!0,Mt=!0,ui=!0),G.id!==O&&(O=G.id,Mt=!0),Ir||E!==v){pe.buffers.depth.getReversed()&&v.reversedDepth!==!0&&(v._reversedDepth=!0,v.updateProjectionMatrix()),tt.setValue(R,"projectionMatrix",v.projectionMatrix),tt.setValue(R,"viewMatrix",v.matrixWorldInverse);let ft=tt.map.cameraPosition;ft!==void 0&&ft.setValue(R,de.setFromMatrixPosition(v.matrixWorld)),Ge.logarithmicDepthBuffer&&tt.setValue(R,"logDepthBufFC",2/(Math.log(v.far+1)/Math.LN2)),(G.isMeshPhongMaterial||G.isMeshToonMaterial||G.isMeshLambertMaterial||G.isMeshBasicMaterial||G.isMeshStandardMaterial||G.isShaderMaterial)&&tt.setValue(R,"isOrthographic",v.isOrthographicCamera===!0),E!==v&&(E=v,Mt=!0,ui=!0)}if(I.isSkinnedMesh){tt.setOptional(R,I,"bindMatrix"),tt.setOptional(R,I,"bindMatrixInverse");let ft=I.skeleton;ft&&(ft.boneTexture===null&&ft.computeBoneTexture(),tt.setValue(R,"boneTexture",ft.boneTexture,Ae))}I.isBatchedMesh&&(tt.setOptional(R,I,"batchingTexture"),tt.setValue(R,"batchingTexture",I._matricesTexture,Ae),tt.setOptional(R,I,"batchingIdTexture"),tt.setValue(R,"batchingIdTexture",I._indirectTexture,Ae),tt.setOptional(R,I,"batchingColorTexture"),I._colorsTexture!==null&&tt.setValue(R,"batchingColorTexture",I._colorsTexture,Ae));let At=H.morphAttributes;if((At.position!==void 0||At.normal!==void 0||At.color!==void 0)&&Te.update(I,H,Pt),(Mt||be.receiveShadow!==I.receiveShadow)&&(be.receiveShadow=I.receiveShadow,tt.setValue(R,"receiveShadow",I.receiveShadow)),G.isMeshGouraudMaterial&&G.envMap!==null&&(wt.envMap.value=ve,wt.flipEnvMap.value=ve.isCubeTexture&&ve.isRenderTargetTexture===!1?-1:1),G.isMeshStandardMaterial&&G.envMap===null&&N.environment!==null&&(wt.envMapIntensity.value=N.environmentIntensity),Mt&&(tt.setValue(R,"toneMappingExposure",M.toneMappingExposure),be.needsLights&&vl(wt,ui),J&&G.fog===!0&&z.refreshFogUniforms(wt,J),z.refreshMaterialUniforms(wt,G,$,k,m.state.transmissionRenderTarget[v.id]),ya.upload(R,_s(be),wt,Ae)),G.isShaderMaterial&&G.uniformsNeedUpdate===!0&&(ya.upload(R,_s(be),wt,Ae),G.uniformsNeedUpdate=!1),G.isSpriteMaterial&&tt.setValue(R,"center",I.center),tt.setValue(R,"modelViewMatrix",I.modelViewMatrix),tt.setValue(R,"normalMatrix",I.normalMatrix),tt.setValue(R,"modelMatrix",I.matrixWorld),G.isShaderMaterial||G.isRawShaderMaterial){let ft=G.uniformsGroups;for(let Ut=0,ba=ft.length;Ut<ba;Ut++){let xr=ft[Ut];ue.update(xr,Pt),ue.bind(xr,Pt)}}return Pt}function vl(v,N){v.ambientLightColor.needsUpdate=N,v.lightProbe.needsUpdate=N,v.directionalLights.needsUpdate=N,v.directionalLightShadows.needsUpdate=N,v.pointLights.needsUpdate=N,v.pointLightShadows.needsUpdate=N,v.spotLights.needsUpdate=N,v.spotLightShadows.needsUpdate=N,v.rectAreaLights.needsUpdate=N,v.hemisphereLights.needsUpdate=N}function xl(v){return v.isMeshLambertMaterial||v.isMeshToonMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isShadowMaterial||v.isShaderMaterial&&v.lights===!0}this.getActiveCubeFace=function(){return D},this.getActiveMipmapLevel=function(){return w},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(v,N,H){let G=Ee.get(v);G.__autoAllocateDepthBuffer=v.resolveDepthBuffer===!1,G.__autoAllocateDepthBuffer===!1&&(G.__useRenderToTexture=!1),Ee.get(v.texture).__webglTexture=N,Ee.get(v.depthTexture).__webglTexture=G.__autoAllocateDepthBuffer?void 0:H,G.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(v,N){let H=Ee.get(v);H.__webglFramebuffer=N,H.__useDefaultFramebuffer=N===void 0};let yl=R.createFramebuffer();this.setRenderTarget=function(v,N=0,H=0){A=v,D=N,w=H;let G=!0,I=null,J=!1,fe=!1;if(v){let _e=Ee.get(v);if(_e.__useDefaultFramebuffer!==void 0)pe.bindFramebuffer(R.FRAMEBUFFER,null),G=!1;else if(_e.__webglFramebuffer===void 0)Ae.setupRenderTarget(v);else if(_e.__hasExternalTextures)Ae.rebindTextures(v,Ee.get(v.texture).__webglTexture,Ee.get(v.depthTexture).__webglTexture);else if(v.depthBuffer){let Ie=v.depthTexture;if(_e.__boundDepthTexture!==Ie){if(Ie!==null&&Ee.has(Ie)&&(v.width!==Ie.image.width||v.height!==Ie.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");Ae.setupDepthRenderbuffer(v)}}let ve=v.texture;(ve.isData3DTexture||ve.isDataArrayTexture||ve.isCompressedArrayTexture)&&(fe=!0);let Ue=Ee.get(v).__webglFramebuffer;v.isWebGLCubeRenderTarget?(Array.isArray(Ue[N])?I=Ue[N][H]:I=Ue[N],J=!0):v.samples>0&&Ae.useMultisampledRTT(v)===!1?I=Ee.get(v).__webglMultisampledFramebuffer:Array.isArray(Ue)?I=Ue[H]:I=Ue,y.copy(v.viewport),U.copy(v.scissor),V=v.scissorTest}else y.copy(me).multiplyScalar($).floor(),U.copy(De).multiplyScalar($).floor(),V=Pe;if(H!==0&&(I=yl),pe.bindFramebuffer(R.FRAMEBUFFER,I)&&G&&pe.drawBuffers(v,I),pe.viewport(y),pe.scissor(U),pe.setScissorTest(V),J){let _e=Ee.get(v.texture);R.framebufferTexture2D(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_CUBE_MAP_POSITIVE_X+N,_e.__webglTexture,H)}else if(fe){let _e=N;for(let ve=0;ve<v.textures.length;ve++){let Ue=Ee.get(v.textures[ve]);R.framebufferTextureLayer(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0+ve,Ue.__webglTexture,H,_e)}}else if(v!==null&&H!==0){let _e=Ee.get(v.texture);R.framebufferTexture2D(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_2D,_e.__webglTexture,H)}O=-1},this.readRenderTargetPixels=function(v,N,H,G,I,J,fe,_e=0){if(!(v&&v.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ve=Ee.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&fe!==void 0&&(ve=ve[fe]),ve){pe.bindFramebuffer(R.FRAMEBUFFER,ve);try{let Ue=v.textures[_e],Ie=Ue.format,Le=Ue.type;if(!Ge.textureFormatReadable(Ie)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Ge.textureTypeReadable(Le)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}N>=0&&N<=v.width-G&&H>=0&&H<=v.height-I&&(v.textures.length>1&&R.readBuffer(R.COLOR_ATTACHMENT0+_e),R.readPixels(N,H,G,I,ie.convert(Ie),ie.convert(Le),J))}finally{let Ue=A!==null?Ee.get(A).__webglFramebuffer:null;pe.bindFramebuffer(R.FRAMEBUFFER,Ue)}}},this.readRenderTargetPixelsAsync=async function(v,N,H,G,I,J,fe,_e=0){if(!(v&&v.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ve=Ee.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&fe!==void 0&&(ve=ve[fe]),ve)if(N>=0&&N<=v.width-G&&H>=0&&H<=v.height-I){pe.bindFramebuffer(R.FRAMEBUFFER,ve);let Ue=v.textures[_e],Ie=Ue.format,Le=Ue.type;if(!Ge.textureFormatReadable(Ie))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Ge.textureTypeReadable(Le))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let ke=R.createBuffer();R.bindBuffer(R.PIXEL_PACK_BUFFER,ke),R.bufferData(R.PIXEL_PACK_BUFFER,J.byteLength,R.STREAM_READ),v.textures.length>1&&R.readBuffer(R.COLOR_ATTACHMENT0+_e),R.readPixels(N,H,G,I,ie.convert(Ie),ie.convert(Le),0);let Ke=A!==null?Ee.get(A).__webglFramebuffer:null;pe.bindFramebuffer(R.FRAMEBUFFER,Ke);let $e=R.fenceSync(R.SYNC_GPU_COMMANDS_COMPLETE,0);return R.flush(),await wh(R,$e,4),R.bindBuffer(R.PIXEL_PACK_BUFFER,ke),R.getBufferSubData(R.PIXEL_PACK_BUFFER,0,J),R.deleteBuffer(ke),R.deleteSync($e),J}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(v,N=null,H=0){let G=Math.pow(2,-H),I=Math.floor(v.image.width*G),J=Math.floor(v.image.height*G),fe=N!==null?N.x:0,_e=N!==null?N.y:0;Ae.setTexture2D(v,0),R.copyTexSubImage2D(R.TEXTURE_2D,H,0,0,fe,_e,I,J),pe.unbindTexture()};let Ml=R.createFramebuffer(),Sl=R.createFramebuffer();this.copyTextureToTexture=function(v,N,H=null,G=null,I=0,J=null){J===null&&(I!==0?(Xr("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),J=I,I=0):J=0);let fe,_e,ve,Ue,Ie,Le,ke,Ke,$e,et=v.isCompressedTexture?v.mipmaps[J]:v.image;if(H!==null)fe=H.max.x-H.min.x,_e=H.max.y-H.min.y,ve=H.isBox3?H.max.z-H.min.z:1,Ue=H.min.x,Ie=H.min.y,Le=H.isBox3?H.min.z:0;else{let At=Math.pow(2,-I);fe=Math.floor(et.width*At),_e=Math.floor(et.height*At),v.isDataArrayTexture?ve=et.depth:v.isData3DTexture?ve=Math.floor(et.depth*At):ve=1,Ue=0,Ie=0,Le=0}G!==null?(ke=G.x,Ke=G.y,$e=G.z):(ke=0,Ke=0,$e=0);let Je=ie.convert(N.format),be=ie.convert(N.type),pt;N.isData3DTexture?(Ae.setTexture3D(N,0),pt=R.TEXTURE_3D):N.isDataArrayTexture||N.isCompressedArrayTexture?(Ae.setTexture2DArray(N,0),pt=R.TEXTURE_2D_ARRAY):(Ae.setTexture2D(N,0),pt=R.TEXTURE_2D),R.pixelStorei(R.UNPACK_FLIP_Y_WEBGL,N.flipY),R.pixelStorei(R.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),R.pixelStorei(R.UNPACK_ALIGNMENT,N.unpackAlignment);let Zt=R.getParameter(R.UNPACK_ROW_LENGTH),Pt=R.getParameter(R.UNPACK_IMAGE_HEIGHT),Ir=R.getParameter(R.UNPACK_SKIP_PIXELS),Mt=R.getParameter(R.UNPACK_SKIP_ROWS),ui=R.getParameter(R.UNPACK_SKIP_IMAGES);R.pixelStorei(R.UNPACK_ROW_LENGTH,et.width),R.pixelStorei(R.UNPACK_IMAGE_HEIGHT,et.height),R.pixelStorei(R.UNPACK_SKIP_PIXELS,Ue),R.pixelStorei(R.UNPACK_SKIP_ROWS,Ie),R.pixelStorei(R.UNPACK_SKIP_IMAGES,Le);let tt=v.isDataArrayTexture||v.isData3DTexture,wt=N.isDataArrayTexture||N.isData3DTexture;if(v.isDepthTexture){let At=Ee.get(v),ft=Ee.get(N),Ut=Ee.get(At.__renderTarget),ba=Ee.get(ft.__renderTarget);pe.bindFramebuffer(R.READ_FRAMEBUFFER,Ut.__webglFramebuffer),pe.bindFramebuffer(R.DRAW_FRAMEBUFFER,ba.__webglFramebuffer);for(let xr=0;xr<ve;xr++)tt&&(R.framebufferTextureLayer(R.READ_FRAMEBUFFER,R.COLOR_ATTACHMENT0,Ee.get(v).__webglTexture,I,Le+xr),R.framebufferTextureLayer(R.DRAW_FRAMEBUFFER,R.COLOR_ATTACHMENT0,Ee.get(N).__webglTexture,J,$e+xr)),R.blitFramebuffer(Ue,Ie,fe,_e,ke,Ke,fe,_e,R.DEPTH_BUFFER_BIT,R.NEAREST);pe.bindFramebuffer(R.READ_FRAMEBUFFER,null),pe.bindFramebuffer(R.DRAW_FRAMEBUFFER,null)}else if(I!==0||v.isRenderTargetTexture||Ee.has(v)){let At=Ee.get(v),ft=Ee.get(N);pe.bindFramebuffer(R.READ_FRAMEBUFFER,Ml),pe.bindFramebuffer(R.DRAW_FRAMEBUFFER,Sl);for(let Ut=0;Ut<ve;Ut++)tt?R.framebufferTextureLayer(R.READ_FRAMEBUFFER,R.COLOR_ATTACHMENT0,At.__webglTexture,I,Le+Ut):R.framebufferTexture2D(R.READ_FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_2D,At.__webglTexture,I),wt?R.framebufferTextureLayer(R.DRAW_FRAMEBUFFER,R.COLOR_ATTACHMENT0,ft.__webglTexture,J,$e+Ut):R.framebufferTexture2D(R.DRAW_FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_2D,ft.__webglTexture,J),I!==0?R.blitFramebuffer(Ue,Ie,fe,_e,ke,Ke,fe,_e,R.COLOR_BUFFER_BIT,R.NEAREST):wt?R.copyTexSubImage3D(pt,J,ke,Ke,$e+Ut,Ue,Ie,fe,_e):R.copyTexSubImage2D(pt,J,ke,Ke,Ue,Ie,fe,_e);pe.bindFramebuffer(R.READ_FRAMEBUFFER,null),pe.bindFramebuffer(R.DRAW_FRAMEBUFFER,null)}else wt?v.isDataTexture||v.isData3DTexture?R.texSubImage3D(pt,J,ke,Ke,$e,fe,_e,ve,Je,be,et.data):N.isCompressedArrayTexture?R.compressedTexSubImage3D(pt,J,ke,Ke,$e,fe,_e,ve,Je,et.data):R.texSubImage3D(pt,J,ke,Ke,$e,fe,_e,ve,Je,be,et):v.isDataTexture?R.texSubImage2D(R.TEXTURE_2D,J,ke,Ke,fe,_e,Je,be,et.data):v.isCompressedTexture?R.compressedTexSubImage2D(R.TEXTURE_2D,J,ke,Ke,et.width,et.height,Je,et.data):R.texSubImage2D(R.TEXTURE_2D,J,ke,Ke,fe,_e,Je,be,et);R.pixelStorei(R.UNPACK_ROW_LENGTH,Zt),R.pixelStorei(R.UNPACK_IMAGE_HEIGHT,Pt),R.pixelStorei(R.UNPACK_SKIP_PIXELS,Ir),R.pixelStorei(R.UNPACK_SKIP_ROWS,Mt),R.pixelStorei(R.UNPACK_SKIP_IMAGES,ui),J===0&&N.generateMipmaps&&R.generateMipmap(pt),pe.unbindTexture()},this.copyTextureToTexture3D=function(v,N,H=null,G=null,I=0){return Xr('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(v,N,H,G,I)},this.initRenderTarget=function(v){Ee.get(v).__webglFramebuffer===void 0&&Ae.setupRenderTarget(v)},this.initTexture=function(v){v.isCubeTexture?Ae.setTextureCube(v,0):v.isData3DTexture?Ae.setTexture3D(v,0):v.isDataArrayTexture||v.isCompressedArrayTexture?Ae.setTexture2DArray(v,0):Ae.setTexture2D(v,0),pe.unbindTexture()},this.resetState=function(){D=0,w=0,A=null,pe.reset(),Me.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Wt}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=Xe._getDrawingBufferColorSpace(e),t.unpackColorSpace=Xe._getUnpackColorSpace()}};function Pm(e){if(!e)return()=>{};let t="#e9bd86",r="#56d39a",i=e.querySelector(".robot-status")||e.closest(".research-robot-wrap")?.querySelector(".robot-status"),a=i?.textContent||"",n=window.matchMedia("(prefers-reduced-motion: reduce)"),s=window.matchMedia("(pointer: coarse)"),o=new Set,l=[],h,c,u,d,f,x,_,m,p,b,M,T=0,D=0,w=!1,A=!0,O=!1,E=n.matches,y=0,U=0,V=0,B=0,X=0,Y=null,k={x:0,y:0},$=[],q=e.dataset.preview||e.closest("[data-preview]")?.dataset.preview,K=new We(q==="attention"?r:t),me=K.clone(),De=performance.now();function Pe(ne){return o.add(ne),ne}function Fe(ne,S,g,P){ne.addEventListener(S,g,P),l.push(()=>ne.removeEventListener(S,g,P))}function j(ne){i&&(i.textContent=ne)}function re(){return E?"Use arrow keys to look · Press Enter to say hello":s.matches?"Touch to look · Tap to say hello":"Move your cursor · Tap to say hello"}function ye(){w||(w=!0,cancelAnimationFrame(T),clearTimeout(D),T=0,b?.disconnect(),M?.disconnect(),l.splice(0).forEach(ne=>ne()),o.forEach(ne=>ne.dispose()),o.clear(),h&&(h.domElement.remove(),h.dispose(),h.forceContextLoss()))}function de(){e.dataset.robotState="unavailable",e.setAttribute("aria-disabled","true"),e.tabIndex=-1,j("Choose a research preview below"),ye()}function he(){w||T||!A||document.hidden||!y||!U||(T=requestAnimationFrame(je))}function Re(){document.hidden||!A?(cancelAnimationFrame(T),T=0):(V=0,B=0,he())}function Ne(ne,S){let g=(ne-De)/1e3,P=E?1:1-Math.exp(-10*S),z=E?1:1-Math.exp(-15*S),W=E?0:Math.sin(g*1.35)*.011;d.position.x=Qt.lerp(d.position.x,k.x*.055,P),d.position.y=Qt.lerp(d.position.y,-.3+W,P),d.rotation.x=Qt.lerp(d.rotation.x,-k.y*.055,P),d.rotation.y=Qt.lerp(d.rotation.y,-k.x*.11,P),d.rotation.z=Qt.lerp(d.rotation.z,-k.x*.045,P),f.rotation.y=Qt.lerp(f.rotation.y,k.x*.39,z),f.rotation.x=Qt.lerp(f.rotation.x,-k.y*.19,z);let F=ne<X,ce=(g+1.1)%4.1,te=!E&&!F&&ce<.25?Math.max(.075,1-Math.sin(ce/.25*Math.PI)):1;$.forEach(ge=>{ge.normal.visible=!F,ge.heart.visible=F,ge.group.scale.set(1.1,1.1*te,1.1)}),K.lerp(me,E?1:1-Math.exp(-7*S)),_.color.copy(K),m.color.copy(K),m.emissive.copy(K),x.uniforms.color.value.copy(K),p.color.copy(K)}function je(ne){if(T=0,w||!A||document.hidden)return;let S=1e3/45;if(!E&&B&&ne-B<S-.5){he();return}let g=V?Math.min((ne-V)/1e3,.08):1/45;V=ne,B=B?ne-(ne-B)%S:ne;try{Ne(ne,g),h.render(c,u),O||(O=!0,e.dataset.robotState="ready",j(re()))}catch{de();return}E||he()}function R(){w||(X=performance.now()+1900,j("Hello, curious human."),clearTimeout(D),D=window.setTimeout(()=>{X=0,j(re()),he()},1900),he())}function it(ne){if(w||ne.target.closest?.("a, button, input, select"))return;let S=e.getBoundingClientRect();!S.width||!S.height||(k.x=Qt.clamp((ne.clientX-S.left)/S.width*2-1,-1,1),k.y=Qt.clamp(1-(ne.clientY-S.top)/S.height*2,-1,1),he())}function Ve(){if(w)return;let ne=e.getBoundingClientRect();y=Math.round(ne.width),U=Math.round(ne.height),!(!y||!U)&&(h.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5)),h.setSize(y,U,!1),u.aspect=y/U,u.updateProjectionMatrix(),he())}function Ge(ne){return Pe(new xc(ne))}function pe(ne,S,g,P,z){let W=new bt(Pe(S),g);return P&&W.position.set(...P),z&&W.rotation.set(...z),ne.add(W),W}function Ze(){let ne=document.createElement("canvas");ne.width=ne.height=256;let S=ne.getContext("2d");if(!S)return null;S.fillStyle="#f1eade",S.fillRect(0,0,256,256);let g=4197,P=()=>(g=g*1664525+1013904223>>>0,g/4294967296);for(let W=0;W<2400;W+=1)S.beginPath(),S.arc(P()*256,P()*256,.3+P()*.6,0,Math.PI*2),S.fillStyle=P()>.2?"rgba(78,64,44,.25)":"rgba(255,251,243,.7)",S.fill();let z=Pe(new go(ne));return z.colorSpace=yt,z.wrapS=z.wrapT=Oi,z.repeat.set(4,2),z}function Ee(){let ne=document.createElement("canvas");ne.width=ne.height=128;let S=ne.getContext("2d");if(!S)return;let g=S.createRadialGradient(64,64,5,64,64,62);g.addColorStop(0,"rgba(0,0,0,.64)"),g.addColorStop(.45,"rgba(0,0,0,.24)"),g.addColorStop(1,"rgba(0,0,0,0)"),S.fillStyle=g,S.fillRect(0,0,128,128);let P=Pe(new go(ne)),z=Pe(new wi({map:P,transparent:!0,depthWrite:!1,opacity:.75}));pe(c,new Qn(1.35,.9),z,[0,-.744,0],[-Math.PI/2,0,0])}function Ae(ne,S,g,P){let z=g?-1:1,W=new jt;W.position.set(S,0,0),W.scale.setScalar(1.3),ne.add(W),pe(W,new ca(.04,.04,.025,24),P.earBase,null,[0,0,Math.PI/2]),pe(W,new yo(.032,.008,10,24),P.gold,[z*.012,0,0],[0,Math.PI/2,0]),pe(W,new ca(.025,.025,.006,24),P.earCenter,[z*.017,0,0],[0,0,Math.PI/2]);let F=new jt;F.position.set(z*.015,.035,0),F.rotation.x=-.4,W.add(F),pe(F,new ca(.006,.008,.02,12),P.gold,[0,.01,0]),pe(F,new ca(.003,.003,.1,8),P.gold,[0,.06,0]),pe(F,new fa(.008,12,8),m,[0,.11,0])}function nt(ne){let S=new gc,g=.025,P=.035,z=.02,W=.005,F=(ce,te)=>new L(ce,te*ne,0);return S.add(new da(F(-g,W),F(-g,P-z))),S.add(new pa(F(-g,P-z),F(-g,P),F(-g+z,P))),S.add(new da(F(-g+z,P),F(g-z,P))),S.add(new pa(F(g-z,P),F(g,P),F(g,P-z))),S.add(new da(F(g,P-z),F(g,W))),S}function at(ne,S,g,P,z){let W=new jt;W.position.set(ne,-.02,.29),W.rotation.y=S,W.scale.setScalar(1.1),f.add(W);let F=new jt;W.add(F),F.add(new bt(g,_)),F.add(new bt(P,_));let ce=new bt(z,_);ce.visible=!1,W.add(ce),$.push({group:W,normal:F,heart:ce})}try{e.dataset.robotState="loading",h=new Cm({alpha:!0,antialias:!0,powerPreference:"low-power"}),h.outputColorSpace=yt,h.toneMapping=Ts,h.toneMappingExposure=1.12,h.setClearColor(0,0);let ne=h.domElement;ne.className="robot-canvas research-robot-canvas",ne.setAttribute("aria-hidden","true"),Object.assign(ne.style,{position:"absolute",inset:"0",width:"100%",height:"100%",display:"block",pointerEvents:"none"}),e.prepend(ne),Fe(ne,"webglcontextlost",ie=>{ie.preventDefault(),de()}),c=new $h,u=new Ct(34,1,.1,20),u.position.set(0,.045,2.82),u.lookAt(0,-.055,0),c.add(new Dc("#fff0d8","#504938",1.1));let S=new rs("#ffe8c6",2.6);S.position.set(3,4,5),c.add(S);let g=new rs("#fff4e3",1.35);g.position.set(-3,1,3),c.add(g);let P=new rs("#e9bd86",3.1);P.position.set(-1,3,-3),c.add(P);let z=Ze(),W=Ge({color:"#d8ccb8",map:z,roughness:.52,metalness:.1}),F={gold:Ge({color:"#b49a72",roughness:.31,metalness:.54}),earBase:Ge({color:"#c9bda9",roughness:.43,metalness:.24}),earCenter:Ge({color:"#75654e",roughness:.65,metalness:.24})};_=Pe(new wi({color:K,toneMapped:!1})),m=Ge({color:K,emissive:K,emissiveIntensity:.4,roughness:.28,metalness:.2}),p=Pe(new wi({color:K,transparent:!0,opacity:.09,depthWrite:!1,toneMapped:!1})),x=Pe(new sr({uniforms:{color:{value:K.clone()},power:{value:3.8},intensity:{value:.55}},transparent:!0,blending:wa,depthWrite:!1,vertexShader:`
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,fragmentShader:`
        uniform vec3 color;
        uniform float power;
        uniform float intensity;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDirection = normalize(vViewPosition);
          float fresnel = pow(1.0 - max(dot(viewDirection, normal), 0.0), power);
          gl_FragColor = vec4(color, fresnel * intensity);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `})),d=new jt,d.position.y=-.3,c.add(d),pe(d,new fa(.43,48,32,0,Math.PI*2,Math.PI*.15,Math.PI*.85),W),pe(d,new yo(.235,.025,12,48),F.gold,[0,.34,0],[Math.PI/2,0,0]);let ce=[[.1,-.05],[.215,-.05],[.28,.02],[.295,.045],[.27,.055],[.1,.055],[.1,.055]].map(([ie,Me])=>new we(ie,Me));pe(d,new _c(ce,48),F.gold,[0,.38,0]),f=new jt,f.position.y=.6,d.add(f);let te=Ge({color:"#101110",roughness:.36,metalness:.16});pe(f,new fa(.28,48,32),te),pe(f,new fa(.3,48,32),x);class ge extends zt{getPoint(Me,ue=new L){let Oe=Me*Math.PI*2,C=16*Math.pow(Math.sin(Oe),3),le=13*Math.cos(Oe)-5*Math.cos(2*Oe)-2*Math.cos(3*Oe)-Math.cos(4*Oe);return ue.set(C*.002,(le+6)*.002,0)}}let Te=Pe(new es(nt(1),20,.0042,8,!1)),Q=Pe(new es(nt(-1),20,.0042,8,!1)),oe=Pe(new es(new ge,48,.0038,8,!0));at(-.07,-.2,Te,Q,oe),at(.07,.2,Te,Q,oe),Ae(f,-.29,!0,F),Ae(f,.29,!1,F),pe(c,new vc(.37,.375,72),p,[0,-.741,0],[-Math.PI/2,0,0]),Ee(),Fe(e,"pointermove",it,{passive:!0}),Fe(e,"pointerleave",()=>{k.x=k.y=0,Y=null,he()},{passive:!0}),Fe(e,"pointerdown",ie=>{ie.button!==0||ie.target.closest?.("a, button, input, select")||(it(ie),Y={id:ie.pointerId,x:ie.clientX,y:ie.clientY,at:performance.now()})},{passive:!0}),Fe(e,"pointerup",ie=>{!Y||Y.id!==ie.pointerId||(Math.hypot(ie.clientX-Y.x,ie.clientY-Y.y)<12&&performance.now()-Y.at<700&&R(),Y=null)},{passive:!0}),Fe(e,"pointercancel",()=>{Y=null},{passive:!0}),Fe(e,"keydown",ie=>{ie.target.closest?.("a, button, input, select")&&ie.target!==e||(ie.key==="Enter"||ie.key===" "?(ie.preventDefault(),ie.repeat||R()):ie.key.startsWith("Arrow")?(ie.preventDefault(),ie.key==="ArrowLeft"&&(k.x=Math.max(-1,k.x-.35)),ie.key==="ArrowRight"&&(k.x=Math.min(1,k.x+.35)),ie.key==="ArrowUp"&&(k.y=Math.min(1,k.y+.35)),ie.key==="ArrowDown"&&(k.y=Math.max(-1,k.y-.35)),he()):ie.key==="Escape"&&(k.x=k.y=0,he()))}),Fe(e,"blur",()=>{k.x=k.y=0,he()}),Fe(e,"research-preview-change",ie=>{me.set(ie.detail?.preview==="attention"?r:t),he()}),Fe(n,"change",()=>{E=n.matches,X||j(re()),V=0,he()}),Fe(document,"visibilitychange",Re),Fe(window,"resize",Ve,{passive:!0}),"ResizeObserver"in window&&(b=new ResizeObserver(Ve),b.observe(e)),"IntersectionObserver"in window&&(M=new IntersectionObserver(ie=>{A=ie[0]?.isIntersecting??!0,Re()},{rootMargin:"80px"}),M.observe(e)),Ve()}catch{de()}return()=>{ye(),e.dataset.robotState="unavailable",i&&(i.textContent=a)}}var Um=document.getElementById("research-robot"),Lm=Pm(Um);window.addEventListener("pagehide",e=>{e.persisted||Lm()},{once:!0});
