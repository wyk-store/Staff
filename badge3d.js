/* WYK STAFF — visite 3D du badge
 * Three.js r160 UMD. Aucune texture distante : les textures sont dessinées localement.
 * API publique : S.badge3D(root, profile, {code, onDispose})
 */
(function (w, d) {
  'use strict';
  var S = w.S = w.S || {};
  var CFG = {
    THREE_URL: 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js',
    FRONT_W: 4096, FRONT_H: 2306, BACK_W: 2048, BACK_H: 1152,
    CARD_W: 5.12, CARD_H: 2.88, CARD_D: 0.052,
    CORNER: 0.164, BEVEL: 0.018, MAX_DPR: 3.0, MAX_PIXELS: 3300000,
    ROTATE_SENSITIVITY: 0.008, DAMPING: 0.91, MIN_ZOOM: 0.70, MAX_ZOOM: 2.20,
    SAFE_MARGIN: 0.94, RED_DAMPING: 0.90, SNAP_SPEED: 0.0008
  };
  var THREE_PROMISE;
  function loadThree() {
    if (w.THREE) return Promise.resolve(w.THREE);
    if (THREE_PROMISE) return THREE_PROMISE;
    THREE_PROMISE = new Promise(function (resolve, reject) {
      var s = d.createElement('script');
      s.src = CFG.THREE_URL; s.async = true;
      s.onload = function () { w.THREE ? resolve(w.THREE) : reject(new Error('Three.js indisponible')); };
      s.onerror = function () { reject(new Error('Impossible de charger Three.js')); };
      d.head.appendChild(s);
    });
    return THREE_PROMISE;
  }
  function roundedRect(ctx, x, y, w0, h0, r) {
    r = Math.min(r, w0 / 2, h0 / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w0 - r, y);
    ctx.quadraticCurveTo(x + w0, y, x + w0, y + r);
    ctx.lineTo(x + w0, y + h0 - r); ctx.quadraticCurveTo(x + w0, y + h0, x + w0 - r, y + h0);
    ctx.lineTo(x + r, y + h0); ctx.quadraticCurveTo(x, y + h0, x, y + h0 - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function canvasTexture(T, canvas, maxAniso) {
    var texCanvas = canvas;
    if (false) { var hi = d.createElement('canvas'); hi.width = CFG.FRONT_W; hi.height = CFG.FRONT_H; var hx = hi.getContext('2d'); hx.imageSmoothingEnabled = true; hx.imageSmoothingQuality = 'high'; hx.drawImage(canvas, 0, 0, hi.width, hi.height); texCanvas = hi; }
    var tex = new T.CanvasTexture(texCanvas);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = maxAniso || 1;
    tex.generateMipmaps = true;
    tex.minFilter = T.LinearMipmapLinearFilter;
    tex.magFilter = T.LinearFilter;
    return tex;
  }
  function buildBackTexture(T, profile, code, maxAniso) {
    var c = d.createElement('canvas'); c.width = CFG.BACK_W; c.height = CFG.BACK_H;
    var x = c.getContext('2d'), W = c.width, H = c.height;
    var g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#ffffff'); g.addColorStop(.48, '#f4f5f8'); g.addColorStop(1, '#e8ebf0');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // Grain PVC subtil généré localement.
    var noise = d.createElement('canvas'); noise.width = 256; noise.height = 144;
    var nx = noise.getContext('2d'), id = nx.createImageData(noise.width, noise.height);
    for (var i = 0; i < id.data.length; i += 4) { var n = 224 + Math.random() * 30; id.data[i] = n; id.data[i+1] = n; id.data[i+2] = n; id.data[i+3] = 18; }
    nx.putImageData(id, 0, 0); x.globalAlpha = .12; x.fillStyle = x.createPattern(noise, 'repeat'); x.fillRect(0,0,W,H); x.globalAlpha = 1;
    x.save(); x.shadowColor = 'rgba(255,255,255,.95)'; x.shadowBlur = 36; x.shadowOffsetX = -16; x.shadowOffsetY = -16;
    roundedRect(x, 74, 74, W-148, H-148, 78); x.fillStyle = '#f8f9fb'; x.fill(); x.restore();
    x.save(); x.shadowColor = 'rgba(70,78,94,.20)'; x.shadowBlur = 35; x.shadowOffsetX = 18; x.shadowOffsetY = 20;
    roundedRect(x, 100, 100, W-200, H-200, 70); x.strokeStyle = '#e9ebf0'; x.lineWidth = 8; x.stroke(); x.restore();
    var pad = 155;
    // Logo typographique embossé.
    x.save(); x.font = '800 104px Montserrat,Arial,sans-serif'; x.textBaseline = 'top';
    x.shadowColor = 'white'; x.shadowBlur = 3; x.shadowOffsetX = -3; x.shadowOffsetY = -4;
    x.fillStyle = '#b7bbc4'; x.fillText('WYK', pad, 142); x.restore();
    x.fillStyle = '#6e7480'; x.font = '700 28px Montserrat,Arial,sans-serif'; x.fillText('STAFF IDENTITY', pad, 275);
    x.fillStyle = '#343943'; x.font = '800 46px Montserrat,Arial,sans-serif';
    x.fillText(String(profile.full_name || 'MEMBRE WYK').toUpperCase().slice(0, 38), pad, 380);
    x.fillStyle = '#6d7380'; x.font = '500 30px Montserrat,Arial,sans-serif';
    x.fillText(String(profile.position || 'ÉQUIPE WYK').toUpperCase().slice(0, 48), pad, 430);
    x.fillStyle = '#454b57'; x.font = '600 26px Montserrat,Arial,sans-serif'; x.fillText('ID EMPLOYÉ', pad, 520);
    x.font = '800 48px Montserrat,Arial,sans-serif'; x.fillStyle = '#9da3ad'; x.fillText(String(code || profile.badge_code || profile.employee_code || 'WYK-STAFF').slice(0, 32), pad, 580);
    // QR réaliste du même lien public, dessiné avec la bibliothèque déjà employée par le site.
    var qrSize = 430, qx = W - pad - qrSize, qy = 260;
    x.save(); x.shadowColor = 'rgba(70,78,94,.22)'; x.shadowBlur = 24; x.shadowOffsetX = 10; x.shadowOffsetY = 12;
    roundedRect(x, qx-22, qy-22, qrSize+44, qrSize+44, 28); x.fillStyle = '#f1f3f7'; x.fill(); x.restore();
    x.fillStyle = '#fff'; x.fillRect(qx, qy, qrSize, qrSize);
    try {
      if (w.qrcode && S.badgeUrl) {
        var qr = w.qrcode(0, 'H'); qr.addData(S.badgeUrl(code)); qr.make();
        var count = qr.getModuleCount(), cell = qrSize / count;
        x.fillStyle = '#fff'; x.fillRect(qx, qy, qrSize, qrSize); x.fillStyle = '#111318';
        for (var yy=0; yy<count; yy++) for (var xx=0; xx<count; xx++) if (qr.isDark(yy,xx)) x.fillRect(qx+xx*cell, qy+yy*cell, Math.ceil(cell), Math.ceil(cell));
      } else {
        x.fillStyle='#17191e'; x.font='700 25px sans-serif'; x.fillText('QR WYK', qx+145, qy+220);
      }
    } catch (_) { x.fillStyle='#17191e'; x.fillRect(qx+35,qy+35,qrSize-70,qrSize-70); }
    x.fillStyle = '#646a75'; x.font = '600 23px Montserrat,Arial,sans-serif'; x.textAlign = 'center'; x.fillText('SCANNER POUR CONSULTER LE BADGE', qx+qrSize/2, qy+qrSize+52); x.textAlign = 'left';
    // Pseudo bande magnétique et puce NFC en relief.
    x.save(); x.shadowColor='rgba(255,255,255,.95)'; x.shadowBlur=10; x.shadowOffsetX=-5; x.shadowOffsetY=-5;
    roundedRect(x, pad, 680, 500, 105, 25); x.fillStyle='#e5e8ed'; x.fill(); x.restore();
    var mg=x.createLinearGradient(pad,680,pad,785); mg.addColorStop(0,'#d7dbe2'); mg.addColorStop(.5,'#f5f6f8'); mg.addColorStop(1,'#d3d7df');
    roundedRect(x,pad,680,500,105,25); x.fillStyle=mg; x.fill();
    x.save(); x.shadowColor='rgba(80,87,100,.25)'; x.shadowBlur=15; x.shadowOffsetX=5; x.shadowOffsetY=6;
    roundedRect(x,W-pad-240,735,180,125,20); x.fillStyle='#e2cfa5'; x.fill(); x.restore();
    x.strokeStyle='#b59c68'; x.lineWidth=5;
    for(var j=0;j<3;j++){x.beginPath();x.moveTo(W-pad-240+j*60,735);x.lineTo(W-pad-240+j*60,860);x.stroke();}
    x.beginPath();x.moveTo(W-pad-240,795);x.lineTo(W-pad-60,795);x.stroke();
    // Signature et texte légal lisibles.
    x.fillStyle='#7b818c'; x.font='600 24px Montserrat,Arial,sans-serif'; x.fillText('SIGNATURE AUTORISÉE',pad,875);
    x.strokeStyle='#b9bec8'; x.lineWidth=3; x.beginPath(); x.moveTo(pad,930); x.lineTo(pad+520,930); x.stroke();
    x.fillStyle='#777d88'; x.font='500 21px Montserrat,Arial,sans-serif';
    x.fillText('Propriété de WYK — si trouvé, merci de rapporter.',pad,1000);
    x.fillText('Ce badge est personnel. Toute reproduction non autorisée est interdite.',pad,1040);
    // Hologramme irisé simulé par un dégradé spectral; l'éclairage 3D ajoute les reflets.
    var hx=W-pad-210, hy=900, hg=x.createLinearGradient(hx,hy,hx+150,hy+100);
    hg.addColorStop(0,'rgba(255,70,100,.55)');hg.addColorStop(.22,'rgba(255,210,90,.52)');hg.addColorStop(.45,'rgba(70,230,190,.48)');hg.addColorStop(.68,'rgba(95,145,255,.52)');hg.addColorStop(1,'rgba(200,95,255,.52)');
    x.save(); x.shadowColor='rgba(255,255,255,.9)';x.shadowBlur=18;roundedRect(x,hx,hy,150,100,18);x.fillStyle=hg;x.fill();x.strokeStyle='rgba(255,255,255,.85)';x.lineWidth=4;x.stroke();x.restore();
    x.fillStyle='#f30707'; x.fillRect(0,H-24,W,24);
    return canvasTexture(T,c,maxAniso);
  }
  function buildNormalMap(T) {
    var c=d.createElement('canvas'); c.width=256;c.height=144;
    var x=c.getContext('2d'),im=x.createImageData(c.width,c.height);
    for(var y=0;y<c.height;y++)for(var xx=0;xx<c.width;xx++){
      var i=(y*c.width+xx)*4, v=(Math.random()-.5)*8;
      im.data[i]=128+v;im.data[i+1]=128+v;im.data[i+2]=255;im.data[i+3]=255;
    }
    x.putImageData(im,0,0); var t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(5,3);return t;
  }
  function buildFrontTexture(T, profile, code, maxAniso, texW) {
    return Promise.resolve().then(function(){return S.badgeCanvas(profile,{code:code,scale:(texW||CFG.FRONT_W)/1920})}).then(function(cv){
      if (!cv || !cv.getContext) throw new Error('Rendu 2D du badge indisponible');
      // La texture vient du moteur d’export pour préserver la composition et le QR.
      return canvasTexture(T,cv,maxAniso);
    });
  }
  function createCardGeometry(T) {
    var shape=new T.Shape(), w=CFG.CARD_W/2, h=CFG.CARD_H/2, r=CFG.CORNER;
    shape.moveTo(-w+r,-h);shape.lineTo(w-r,-h);shape.quadraticCurveTo(w,-h,w,-h+r);
    shape.lineTo(w,h-r);shape.quadraticCurveTo(w,h,w-r,h);
    shape.lineTo(-w+r,h);shape.quadraticCurveTo(-w,h,-w,h-r);
    shape.lineTo(-w,-h+r);shape.quadraticCurveTo(-w,-h,-w+r,-h);
    var g=new T.ExtrudeGeometry(shape,{depth:CFG.CARD_D,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:CFG.BEVEL,bevelThickness:CFG.BEVEL,curveSegments:12});
    g.center();g.computeVertexNormals();return g;
  }
  function buildLanyard(T, group) {
    var red=new T.MeshPhysicalMaterial({color:0xf30707,roughness:.46,metalness:.05,clearcoat:.35});
    var dark=new T.MeshStandardMaterial({color:0x1c1d20,metalness:.82,roughness:.28});
    var strap=new T.Mesh(new T.BoxGeometry(.30,1.75,.035),red);strap.position.set(0,2.22,0);strap.rotation.z=-.08;group.add(strap);
    // Couture discrète.
    var stitchMat=new T.MeshBasicMaterial({color:0xffc4c4});
    for(var s=-1;s<=1;s+=2){var points=[];for(var k=0;k<=18;k++)points.push(new T.Vector3(s*.125,1.5+k*.078,.021));var curve=new T.CatmullRomCurve3(points);group.add(new T.Mesh(new T.TubeGeometry(curve,24,.004,4,false),stitchMat));}
    var ring=new T.Mesh(new T.TorusGeometry(.105,.024,10,32),dark);ring.position.set(0,1.30,.01);group.add(ring);
    var clip=new T.Mesh(new T.BoxGeometry(.22,.38,.075),dark);clip.position.set(0,1.06,.02);group.add(clip);
    var pin=new T.Mesh(new T.CylinderGeometry(.045,.045,.09,20),new T.MeshStandardMaterial({color:0xbcc1c9,metalness:.95,roughness:.22}));pin.rotation.x=Math.PI/2;pin.position.set(0,.84,.03);group.add(pin);
    return {strap:strap,ring:ring,clip:clip};
  }
  function makeBackPlate(T, texture, normal) {
    return new T.MeshPhysicalMaterial({map:texture,normalMap:normal,normalScale:new T.Vector2(.14,.14),color:0xffffff,roughness:.38,metalness:.02,clearcoat:.12,clearcoatRoughness:.45,ior:1.45});
  }
  function setupLights(T,scene,renderer) {
    scene.add(new T.HemisphereLight(0xffffff,0x27212a,2.0));
    var key=new T.DirectionalLight(0xfff2e8,3.2);key.position.set(-4,5,7);scene.add(key);
    var fill=new T.DirectionalLight(0xcbd9ff,1.65);fill.position.set(5,1,5);scene.add(fill);
    var rim=new T.DirectionalLight(0xff1c2b,2.5);rim.position.set(0,3,-5);scene.add(rim);
    var point=new T.PointLight(0xffffff,1.2,12);point.position.set(0,0,5);scene.add(point);
    return {hemi:scene.children.find(function(o){return o.isHemisphereLight}),key:key,fill:fill,rim:rim,point:point};
  }
  function badge3D(root, profile, opts) {
    opts=opts||{};
    if(!root||!profile||!w.WebGLRenderingContext||w.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
    var host=d.createElement('div');host.className='wyk3d-stage';host.setAttribute('role','region');host.setAttribute('aria-label','Visite 3D interactive du badge WYK');
    var canvas=d.createElement('canvas');canvas.setAttribute('aria-label','Badge 3D. Glissez pour tourner, espace pour retourner.');host.appendChild(canvas);canvas.addEventListener('webglcontextlost',function(e){e.preventDefault();if(fallback)fallback.classList.remove('wyk3d-fallback-hidden');disposeAll();},{once:true});
    var fallback=root.querySelector('.bdg-host')||root.querySelector('[data-bdg]')||root.firstElementChild;
    if(fallback) fallback.classList.add('wyk3d-fallback');
    root.insertBefore(host,root.firstChild);
    if('MutationObserver'in w){mutationObs=new MutationObserver(function(){if(!host.isConnected)disposeAll();});mutationObs.observe(d.documentElement,{childList:true,subtree:true});}
    var disposed=false, raf=0, renderer, scene, camera, card, frontMat, backMat, normal, resizeObs, intersectionObs, mutationObs, lights, THREE_REF=null;
    var pointers=new Map(), lastX=0,lastY=0,velX=0,velY=0,zoom=1, targetFlip=0, tourTimer=0, tourPaused=false, frameCount=0, quality='Haut';
    var lastTime=0, still=0, isDragging=false, startX=0,startY=0,startAt=0, oldDist=0, oldAngle=0;
    var reduced=false, pageVisible=!d.hidden, inView=true, active=true, lastPointerAt=0, tapTimer=0, lastTapAt=0, themeObserver=null, gyroHandler=null, initialRotation=0;
    function button(label, action, icon) {var b=d.createElement('button');b.type='button';b.className='wyk3d-action';b.textContent=label;b.setAttribute('aria-label',label);b.addEventListener('click',action);actions.appendChild(b);return b;}
    var actions=d.createElement('div');actions.className='wyk3d-actions';
    var status=d.createElement('div');status.className='wyk3d-caption';status.textContent='Préparation de la visite 3D…';host.appendChild(status);
    function haptic(ms){try{if(navigator.vibrate)navigator.vibrate(ms||12)}catch(_){}}
    function schedule(){if(!disposed&&!raf&&pageVisible&&inView)raf=requestAnimationFrame(render);}
    function fitCameraToCard(){if(!camera||!host)return;var r=host.getBoundingClientRect(),aspect=Math.max(.25,(r.width||640)/(r.height||420)),fov=camera.fov*Math.PI/180,halfW=CFG.CARD_W*.5,halfH=CFG.CARD_H*.5;var distance=Math.max(halfH/Math.tan(fov/2),halfW/(Math.tan(fov/2)*aspect));distance=(distance/CFG.SAFE_MARGIN)+.35;camera.position.z=Math.max(distance,4.0)/zoom;camera.aspect=aspect;camera.updateProjectionMatrix();}
    function syncTheme(){if(!scene||!lights)return;var dark=d.documentElement.getAttribute('data-theme')==='dark';scene.fog=null;lights.hemi.intensity=dark?1.9:2.25;lights.key.intensity=dark?3.0:2.4;lights.fill.intensity=dark?1.6:1.25;lights.rim.intensity=dark?2.6:1.15;lights.point.intensity=dark?1.2:.65;var tc=d.getElementById('wykThemeColor');if(tc)tc.setAttribute('content',dark?'#08080a':'#f3f4f7');if(renderer)renderer.setClearColor(dark?0x09080a:0xf0f1f5,0);schedule();}
    function disposeAll(){
      if(disposed)return;disposed=true;if(raf)cancelAnimationFrame(raf);if(tourTimer)clearTimeout(tourTimer);
      if(resizeObs)resizeObs.disconnect();if(intersectionObs)intersectionObs.disconnect();if(mutationObs)mutationObs.disconnect();
      host.removeEventListener('pointerdown',onDown);host.removeEventListener('pointermove',onMove);host.removeEventListener('pointerup',onUp);host.removeEventListener('pointercancel',onUp);host.removeEventListener('lostpointercapture',onUp);
      d.removeEventListener('keydown',onKey);d.removeEventListener('visibilitychange',onVisibility);w.removeEventListener('resize',onResize);w.removeEventListener('orientationchange',onResize);if(w.visualViewport)w.visualViewport.removeEventListener('resize',onResize);if(themeObserver)themeObserver.disconnect();if(gyroHandler){w.removeEventListener('deviceorientation',gyroHandler);gyroHandler=null;}if(tapTimer)clearTimeout(tapTimer);
      if(renderer){renderer.dispose();if(renderer.forceContextLoss)renderer.forceContextLoss();}
      if(scene)scene.traverse(function(o){if(o.geometry)o.geometry.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){Object.keys(m).forEach(function(k){if(m[k]&&m[k].isTexture)m[k].dispose()});m.dispose()})}});
      host.remove();if(fallback)fallback.classList.remove('wyk3d-fallback');if(typeof opts.onDispose==='function')opts.onDispose();
    }
    function onVisibility(){pageVisible=!d.hidden;if(pageVisible)schedule();else if(raf){cancelAnimationFrame(raf);raf=0;}}
    function onResize(){if(!renderer||disposed)return;var rect=host.getBoundingClientRect();if(!rect.width||!rect.height)return;var dpr=Math.min(w.devicePixelRatio||1,CFG.MAX_DPR,Math.sqrt(CFG.MAX_PIXELS/Math.max(1,rect.width*rect.height)));renderer.setPixelRatio(dpr);renderer.setSize(rect.width,rect.height,false);fitCameraToCard();schedule();}
    function onDown(e){if(disposed)return;try{host.setPointerCapture&&host.setPointerCapture(e.pointerId)}catch(_){}pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});startX=e.clientX;startY=e.clientY;startAt=performance.now();lastX=e.clientX;lastY=e.clientY;isDragging=false;oldDist=0;oldAngle=0;lastPointerAt=performance.now();}
    function onMove(e){
      if(!pointers.has(e.pointerId))return;
      var prev=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(!isDragging&&Math.hypot(e.clientX-startX,e.clientY-startY)<6&&pointers.size===1)return;isDragging=true;host.classList.add('is-dragging');lastPointerAt=performance.now();
      if(pointers.size===1&&card){var dx=e.clientX-prev.x,dy=e.clientY-prev.y;velY=dx*CFG.ROTATE_SENSITIVITY;velX=dy*CFG.ROTATE_SENSITIVITY;card.rotation.y+=velY;card.rotation.x+=velX;card.rotation.x=Math.max(-1.35,Math.min(1.35,card.rotation.x));}
      if(pointers.size===2&&card){var ps=Array.from(pointers.values()),dx2=ps[1].x-ps[0].x,dy2=ps[1].y-ps[0].y,dist=Math.hypot(dx2,dy2),ang=Math.atan2(dy2,dx2);if(oldDist){zoom=Math.max(CFG.MIN_ZOOM,Math.min(CFG.MAX_ZOOM,zoom*dist/oldDist));camera.position.z=5.8/zoom;}if(oldAngle)card.rotation.z+=ang-oldAngle;oldDist=dist;oldAngle=ang;}
      schedule();
    }
    function onUp(e){if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);if(!pointers.size){var elapsed=performance.now()-startAt,dist=Math.hypot(e.clientX-startX,e.clientY-startY);isDragging=false;host.classList.remove('is-dragging');if(elapsed<260&&dist<10){if(performance.now()-lastTapAt<300){reset();lastTapAt=0;}else lastTapAt=performance.now();}if(Math.abs(velY)>.04||Math.abs(velX)>.04)schedule();}}
    function flip(){if(!card)return;targetFlip+=Math.PI;haptic(16);status.textContent='Face '+(Math.abs(targetFlip/Math.PI%2)>0.5?'arrière':'avant')+' du badge';schedule();}
    function reset(){if(!card)return;targetFlip=0;zoom=1;card.rotation.set(-.10,.24,0);velX=velY=0;status.textContent='Badge WYK — glissez pour explorer';fitCameraToCard();schedule();}
    function onKey(e){if(!host.isConnected||!host.contains(d.activeElement))return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','+','-','r','R','t','T','f','F','Escape'].indexOf(e.key)<0)return;if(e.key===' '){e.preventDefault();flip();}else if(e.key==='r'||e.key==='R')reset();else if(e.key==='t'||e.key==='T')tour();else if(e.key==='f'||e.key==='F'){if(host.requestFullscreen)host.requestFullscreen().catch(function(){});}else if(e.key==='Escape'){tourPaused=true;if(tourTimer)clearTimeout(tourTimer);}else if(e.key==='+'){zoom=Math.min(CFG.MAX_ZOOM,zoom+.1);fitCameraToCard();schedule();}else if(e.key==='-'){zoom=Math.max(CFG.MIN_ZOOM,zoom-.1);fitCameraToCard();schedule();}else{card.rotation.y+=(e.key==='ArrowLeft'?.12:e.key==='ArrowRight'?-.12:0);card.rotation.x+=(e.key==='ArrowUp'?.12:e.key==='ArrowDown'?-.12:0);schedule();}}
    function tour(){if(!card)return;var steps=[['Vue générale',-.12,.25,5.8],['Profil et identité',-.08,.15,4.3],['Tranche PVC',.18,1.25,4.7],['Face arrière',-.12,Math.PI+.18,5.2],['Retour à la face avant',-.1,.24,5.8]],i=0;tourPaused=false;function next(){tourTimer=0;if(disposed||tourPaused||i>=steps.length)return;var s=steps[i++];status.textContent=s[0];targetFlip=s[2];camera.position.z=s[3];card.rotation.x=s[1];card.rotation.y=s[2];schedule();tourTimer=setTimeout(next,1900);}next();}
    function onDoubleTap(){reset();}
    function render(now){
      raf=0;if(disposed||!renderer||!pageVisible||!inView)return;
      var dt=lastTime?Math.min(.04,(now-lastTime)/1000):.016;lastTime=now;
      if(!isDragging&&Math.abs(velX)+Math.abs(velY)>.0008){card.rotation.x+=velX;card.rotation.y+=velY;velX*=CFG.DAMPING;velY*=CFG.DAMPING;}
      if(!isDragging&&Math.abs(targetFlip-card.rotation.y)>.002){var diff=targetFlip-card.rotation.y;card.rotation.y+=diff*.095;}
      if(!isDragging&&Math.abs(velX)+Math.abs(velY)<.0008){velX=velY=0;}
      var t=now*.001; if(card){card.children.forEach(function(o){if(o.userData.holo)o.material.opacity=.5+.12*Math.sin(t*1.2);});}
      if(renderer){renderer.render(scene,camera);frameCount++;if(opts.debug){status.textContent='WYK 3D · '+quality+' · '+Math.round(1/Math.max(dt,.001))+' FPS';}}
      if(isDragging||Math.abs(velX)+Math.abs(velY)>.001||Math.abs(targetFlip-card.rotation.y)>.006||tourTimer)schedule();
    }
    host.addEventListener('pointerdown',onDown);host.addEventListener('pointermove',onMove);host.addEventListener('pointerup',onUp);host.addEventListener('pointercancel',onUp);host.addEventListener('lostpointercapture',onUp);
    host.addEventListener('wheel',function(e){e.preventDefault();zoom=Math.max(CFG.MIN_ZOOM,Math.min(CFG.MAX_ZOOM,zoom*(e.deltaY>0?.94:1.06)));fitCameraToCard();schedule();},{passive:false});
    d.addEventListener('keydown',onKey);d.addEventListener('visibilitychange',onVisibility);w.addEventListener('resize',onResize);w.addEventListener('orientationchange',onResize);if(w.visualViewport)w.visualViewport.addEventListener('resize',onResize,{passive:true});if('MutationObserver'in w){themeObserver=new MutationObserver(syncTheme);themeObserver.observe(d.documentElement,{attributes:true,attributeFilter:['data-theme']});}
    button('Retourner',flip);button('Tour',tour);button('Recentrer',reset);button('PNG',function(){if(S.downloadBadge)S.downloadBadge(profile,{code:opts.code},'png')});button('PDF',function(){if(S.downloadBadge)S.downloadBadge(profile,{code:opts.code},'pdf')});button('Partager',function(){if(S.share&&S.badgeUrl)S.share(S.badgeUrl(opts.code),'Badge de '+(profile.full_name||'WYK'))});button('Profil',function(){w.location.href='/profil?id='+encodeURIComponent(opts.code||profile.badge_code||profile.employee_code||'')});button('Pivoter',function(){if(card){card.rotation.z+=Math.PI/2;fitCameraToCard();schedule();}});button('Lanyard',function(){if(card){card.position.y=card.position.y>.1?0:.18;status.textContent='Mode lanyard — aperçu suspendu';schedule();}});button('Plein écran',function(){if(host.requestFullscreen)host.requestFullscreen().catch(function(){});});
    // Barre d’actions placée hors de la scène : elle ne masque jamais la carte.
    root.insertBefore(actions, fallback && fallback.parentNode === root ? fallback : null);
    intersectionObs=('IntersectionObserver'in w)?new IntersectionObserver(function(entries){inView=entries[0].isIntersecting;if(inView)schedule();else if(raf){cancelAnimationFrame(raf);raf=0;}},{threshold:.01}):null;
    if(intersectionObs)intersectionObs.observe(host);
    resizeObs=('ResizeObserver'in w)?new ResizeObserver(onResize):null;if(resizeObs)resizeObs.observe(host);
    loadThree().then(async function(T){
      if(disposed)return;
      try{
        THREE_REF=T;renderer=new T.WebGLRenderer({canvas:canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
        renderer.setPixelRatio(Math.min(w.devicePixelRatio||1,CFG.MAX_DPR,Math.sqrt(CFG.MAX_PIXELS/Math.max(1,(host.clientWidth||640)*(host.clientHeight||420)))));renderer.setSize(host.clientWidth||640,host.clientHeight||420,false);
        renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
        scene=new T.Scene();scene.background=null;camera=new T.PerspectiveCamera(34,(host.clientWidth||640)/(host.clientHeight||420),.1,80);camera.position.set(0,.1,5.8);
        lights=setupLights(T,scene,renderer);
        var group=new T.Group();scene.add(group);card=group;card.rotation.set(-.1,.24,0);
        var geom=createCardGeometry(T),aniso=renderer.capabilities.getMaxAnisotropy();
        var smallDev=(w.matchMedia&&w.matchMedia('(pointer:coarse)').matches)||(navigator.deviceMemory&&navigator.deviceMemory<=4),texW=Math.min(renderer.capabilities.maxTextureSize||2048,smallDev?3072:4096);
        var pair=await Promise.all([buildFrontTexture(T,profile,opts.code,aniso,texW),Promise.resolve(buildBackTexture(T,profile,opts.code,aniso))]);
        if(disposed){pair[0].dispose();pair[1].dispose();return;}
        frontMat=new T.MeshBasicMaterial({map:pair[0],toneMapped:false});
        backMat=makeBackPlate(T,pair[1],buildNormalMap(T));
        // ExtrudeGeometry material groups: front/back use face textures, sides use pearl PVC.
        var edge=new T.MeshPhysicalMaterial({color:0xeeeef2,roughness:.3,metalness:.1,clearcoat:.65,clearcoatRoughness:.22});
        var mesh=new T.Mesh(geom,[frontMat,edge,backMat]);mesh.rotation.x=0;group.add(mesh);
        // Face arrière posée à l'envers sur le dos de l'extrusion, légèrement décalée pour éviter le z-fighting.
        var back=new T.Mesh(new T.PlaneGeometry(CFG.CARD_W-.12,CFG.CARD_H-.12),backMat);back.position.z=-CFG.CARD_D/2-CFG.BEVEL-.002;back.rotation.y=Math.PI;group.add(back);
        var front=new T.Mesh(new T.PlaneGeometry(CFG.CARD_W-.12,CFG.CARD_H-.12),frontMat);front.position.z=CFG.CARD_D/2+CFG.BEVEL+.002;group.add(front);
        var gloss=new T.Mesh(new T.PlaneGeometry(CFG.CARD_W-.12,CFG.CARD_H-.12),new T.MeshPhysicalMaterial({color:0x000000,roughness:.22,metalness:0,clearcoat:1,clearcoatRoughness:.12,ior:1.45,normalMap:buildNormalMap(T),normalScale:new T.Vector2(.035,.035),transparent:true,opacity:.45,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));gloss.position.z=CFG.CARD_D/2+CFG.BEVEL+.004;group.add(gloss);
        var floor=new T.Mesh(new T.CircleGeometry(3.8,64),new T.MeshBasicMaterial({color:0x151116,transparent:true,opacity:.15}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.85;floor.position.z=-.2;scene.add(floor);
        var lanyard=buildLanyard(T,group);lanyard.strap.position.y=2.22;
        // Halo de studio léger, sans texture externe.
        var halo=new T.Mesh(new T.PlaneGeometry(10,6),new T.MeshBasicMaterial({color:0x4d1118,transparent:true,opacity:.10,depthWrite:false}));halo.position.z=-1.4;scene.add(halo);
        host.classList.add('wyk3d-ready');if(fallback)fallback.classList.add('wyk3d-fallback-hidden');
        canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Badge WYK de '+(profile.full_name||'membre')+', '+(profile.position||'équipe')+'. Utilisez les flèches pour tourner, Espace pour retourner, plus et moins pour zoomer.');
        status.textContent='Badge WYK — glissez pour explorer';syncTheme();onResize();schedule();
      }catch(err){disposeAll();if(fallback)fallback.classList.remove('wyk3d-fallback-hidden');}
    }).catch(function(){disposeAll();if(fallback)fallback.classList.remove('wyk3d-fallback-hidden');});
    return {dispose:disposeAll,flip:flip,reset:reset,tour:tour,host:host};
  }
  S.badge3D=badge3D;
  S.badge3DConfig=CFG;
})(window,document);
