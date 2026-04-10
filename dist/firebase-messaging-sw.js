import{_ as L,C as x,E as j,o as D,d as g,g as F,a as R,b as M,i as P,v as U,c as H}from"./assets/index.esm-CnuuTg21.js";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const O="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",V="https://fcmregistrations.googleapis.com/v1",C="FCM_MSG",W="google.c.a.c_id",$=3,G=1;var d;(function(e){e[e.DATA_MESSAGE=1]="DATA_MESSAGE",e[e.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(d||(d={}));/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */var l;(function(e){e.PUSH_RECEIVED="push-received",e.NOTIFICATION_CLICKED="notification-clicked"})(l||(l={}));/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function u(e){const t=new Uint8Array(e);return btoa(String.fromCharCode(...t)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function q(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),i=atob(n),o=new Uint8Array(i.length);for(let s=0;s<i.length;++s)o[s]=i.charCodeAt(s);return o}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const b="fcm_token_details_db",J=5,I="fcm_token_object_Store";async function z(e){if("databases"in indexedDB&&!(await indexedDB.databases()).map(s=>s.name).includes(b))return null;let t=null;return(await D(b,J,{upgrade:async(i,o,s,a)=>{if(o<2||!i.objectStoreNames.contains(I))return;const v=a.objectStore(I),p=await v.index("fcmSenderId").get(e);if(await v.clear(),!!p){if(o===2){const r=p;if(!r.auth||!r.p256dh||!r.endpoint)return;t={token:r.fcmToken,createTime:r.createTime??Date.now(),subscriptionOptions:{auth:r.auth,p256dh:r.p256dh,endpoint:r.endpoint,swScope:r.swScope,vapidKey:typeof r.vapidKey=="string"?r.vapidKey:u(r.vapidKey)}}}else if(o===3){const r=p;t={token:r.fcmToken,createTime:r.createTime,subscriptionOptions:{auth:u(r.auth),p256dh:u(r.p256dh),endpoint:r.endpoint,swScope:r.swScope,vapidKey:u(r.vapidKey)}}}else if(o===4){const r=p;t={token:r.fcmToken,createTime:r.createTime,subscriptionOptions:{auth:u(r.auth),p256dh:u(r.p256dh),endpoint:r.endpoint,swScope:r.swScope,vapidKey:u(r.vapidKey)}}}}}})).close(),await g(b),await g("fcm_vapid_details_db"),await g("undefined"),Y(t)?t:null}function Y(e){if(!e||!e.subscriptionOptions)return!1;const{subscriptionOptions:t}=e;return typeof e.createTime=="number"&&e.createTime>0&&typeof e.token=="string"&&e.token.length>0&&typeof t.auth=="string"&&t.auth.length>0&&typeof t.p256dh=="string"&&t.p256dh.length>0&&typeof t.endpoint=="string"&&t.endpoint.length>0&&typeof t.swScope=="string"&&t.swScope.length>0&&typeof t.vapidKey=="string"&&t.vapidKey.length>0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Q="firebase-messaging-database",X=1,f="firebase-messaging-store";let w=null;function k(){return w||(w=D(Q,X,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(f)}}})),w}async function m(e){const t=S(e),i=await(await k()).transaction(f).objectStore(f).get(t);if(i)return i;{const o=await z(e.appConfig.senderId);if(o)return await y(e,o),o}}async function y(e,t){const n=S(e),o=(await k()).transaction(f,"readwrite");return await o.objectStore(f).put(t,n),await o.done,t}async function Z(e){const t=S(e),i=(await k()).transaction(f,"readwrite");await i.objectStore(f).delete(t),await i.done}function S({appConfig:e}){return e.appId}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ee={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used."},c=new j("messaging","Messaging",ee);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function te(e,t){const n=await T(e),i=K(t),o={method:"POST",headers:n,body:JSON.stringify(i)};let s;try{s=await(await fetch(_(e.appConfig),o)).json()}catch(a){throw c.create("token-subscribe-failed",{errorInfo:a?.toString()})}if(s.error){const a=s.error.message;throw c.create("token-subscribe-failed",{errorInfo:a})}if(!s.token)throw c.create("token-subscribe-no-token");return s.token}async function ne(e,t){const n=await T(e),i=K(t.subscriptionOptions),o={method:"PATCH",headers:n,body:JSON.stringify(i)};let s;try{s=await(await fetch(`${_(e.appConfig)}/${t.token}`,o)).json()}catch(a){throw c.create("token-update-failed",{errorInfo:a?.toString()})}if(s.error){const a=s.error.message;throw c.create("token-update-failed",{errorInfo:a})}if(!s.token)throw c.create("token-update-no-token");return s.token}async function N(e,t){const i={method:"DELETE",headers:await T(e)};try{const s=await(await fetch(`${_(e.appConfig)}/${t}`,i)).json();if(s.error){const a=s.error.message;throw c.create("token-unsubscribe-failed",{errorInfo:a})}}catch(o){throw c.create("token-unsubscribe-failed",{errorInfo:o?.toString()})}}function _({projectId:e}){return`${V}/projects/${e}/registrations`}async function T({appConfig:e,installations:t}){const n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function K({p256dh:e,auth:t,endpoint:n,vapidKey:i}){const o={web:{endpoint:n,auth:t,p256dh:e}};return i!==O&&(o.web.applicationPubKey=i),o}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ie=10080*60*1e3;async function oe(e){const t=await re(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:u(t.getKey("auth")),p256dh:u(t.getKey("p256dh"))},i=await m(e.firebaseDependencies);if(i){if(ae(i.subscriptionOptions,n))return Date.now()>=i.createTime+ie?se(e,{token:i.token,createTime:Date.now(),subscriptionOptions:n}):i.token;try{await N(e.firebaseDependencies,i.token)}catch(o){console.warn(o)}return A(e.firebaseDependencies,n)}else return A(e.firebaseDependencies,n)}async function E(e){const t=await m(e.firebaseDependencies);t&&(await N(e.firebaseDependencies,t.token),await Z(e.firebaseDependencies));const n=await e.swRegistration.pushManager.getSubscription();return n?n.unsubscribe():!0}async function se(e,t){try{const n=await ne(e.firebaseDependencies,t),i={...t,token:n,createTime:Date.now()};return await y(e.firebaseDependencies,i),n}catch(n){throw n}}async function A(e,t){const i={token:await te(e,t),createTime:Date.now(),subscriptionOptions:t};return await y(e,i),i.token}async function re(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:q(t)})}function ae(e,t){const n=t.vapidKey===e.vapidKey,i=t.endpoint===e.endpoint,o=t.auth===e.auth,s=t.p256dh===e.p256dh;return n&&i&&o&&s}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ce(e){const t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return ue(t,e),fe(t,e),pe(t,e),t}function ue(e,t){if(!t.notification)return;e.notification={};const n=t.notification.title;n&&(e.notification.title=n);const i=t.notification.body;i&&(e.notification.body=i);const o=t.notification.image;o&&(e.notification.image=o);const s=t.notification.icon;s&&(e.notification.icon=s)}function fe(e,t){t.data&&(e.data=t.data)}function pe(e,t){if(!t.fcmOptions&&!t.notification?.click_action)return;e.fcmOptions={};const n=t.fcmOptions?.link??t.notification?.click_action;n&&(e.fcmOptions.link=n);const i=t.fcmOptions?.analytics_label;i&&(e.fcmOptions.analyticsLabel=i)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function de(e){return typeof e=="object"&&!!e&&W in e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function le(e){return new Promise(t=>{setTimeout(t,e)})}async function ge(e,t){const n=be(t,await e.firebaseDependencies.installations.getId());we(e,n,t.productId)}function be(e,t){const n={};return e.from&&(n.project_number=e.from),e.fcmMessageId&&(n.message_id=e.fcmMessageId),n.instance_id=t,e.notification?n.message_type=d.DISPLAY_NOTIFICATION.toString():n.message_type=d.DATA_MESSAGE.toString(),n.sdk_platform=$.toString(),n.package_name=self.origin.replace(/(^\w+:|^)\/\//,""),e.collapse_key&&(n.collapse_key=e.collapse_key),n.event=G.toString(),e.fcmOptions?.analytics_label&&(n.analytics_label=e.fcmOptions?.analytics_label),n}function we(e,t,n){const i={};i.event_time_ms=Math.floor(Date.now()).toString(),i.source_extension_json_proto3=JSON.stringify({messaging_client_event:t}),n&&(i.compliance_data=he(n)),e.logEvents.push(i)}function he(e){return{privacy_context:{prequest:{origin_associated_product_id:e}}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ke(e,t){const{newSubscription:n}=e;if(!n){await E(t);return}const i=await m(t.firebaseDependencies);await E(t),t.vapidKey=i?.subscriptionOptions?.vapidKey??O,await oe(t)}async function me(e,t){const n=_e(e);if(!n)return;t.deliveryMetricsExportedToBigQueryEnabled&&await ge(t,n);const i=await B();if(ve(i))return Ie(i,n);if(n.notification&&await Ee(Se(n)),!!t&&t.onBackgroundMessageHandler){const o=ce(n);typeof t.onBackgroundMessageHandler=="function"?await t.onBackgroundMessageHandler(o):t.onBackgroundMessageHandler.next(o)}}async function ye(e){const t=e.notification?.data?.[C];if(t){if(e.action)return}else return;e.stopImmediatePropagation(),e.notification.close();const n=Ae(t);if(!n)return;const i=new URL(n,self.location.href),o=new URL(self.location.origin);if(i.host!==o.host)return;let s=await Te(i);if(s?s=await s.focus():(s=await self.clients.openWindow(n),await le(3e3)),!!s)return t.messageType=l.NOTIFICATION_CLICKED,t.isFirebaseMessaging=!0,s.postMessage(t)}function Se(e){const t={...e.notification};return t.data={[C]:e},t}function _e({data:e}){if(!e)return null;try{return e.json()}catch{return null}}async function Te(e){const t=await B();for(const n of t){const i=new URL(n.url,self.location.href);if(e.host===i.host)return n}return null}function ve(e){return e.some(t=>t.visibilityState==="visible"&&!t.url.startsWith("chrome-extension://"))}function Ie(e,t){t.isFirebaseMessaging=!0,t.messageType=l.PUSH_RECEIVED;for(const n of e)n.postMessage(t)}function B(){return self.clients.matchAll({type:"window",includeUncontrolled:!0})}function Ee(e){const{actions:t}=e,{maxActions:n}=Notification;return t&&n&&t.length>n&&console.warn(`This browser only supports ${n} actions. The remaining actions will not be displayed.`),self.registration.showNotification(e.title??"",e)}function Ae(e){const t=e.fcmOptions?.link??e.notification?.click_action;return t||(de(e.data)?self.location.origin:null)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function De(e){if(!e||!e.options)throw h("App Configuration Object");if(!e.name)throw h("App Name");const t=["projectId","apiKey","appId","messagingSenderId"],{options:n}=e;for(const i of t)if(!n[i])throw h(i);return{appName:e.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function h(e){return c.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Me{constructor(t,n,i){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.logEvents=[],this.isLogServiceStarted=!1;const o=De(t);this.firebaseDependencies={app:t,appConfig:o,installations:n,analyticsProvider:i}}_delete(){return Promise.resolve()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Oe=e=>{const t=new Me(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return self.addEventListener("push",n=>{n.waitUntil(me(n,t))}),self.addEventListener("pushsubscriptionchange",n=>{n.waitUntil(ke(n,t))}),self.addEventListener("notificationclick",n=>{n.waitUntil(ye(n))}),t};function Ce(){L(new x("messaging-sw",Oe,"PUBLIC"))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ne(){return P()&&await U()&&"PushManager"in self&&"Notification"in self&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ke(e,t){if(self.document!==void 0)throw c.create("only-available-in-sw");return e.onBackgroundMessageHandler=t,()=>{e.onBackgroundMessageHandler=null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Be(e=F()){return Ne().then(t=>{if(!t)throw c.create("unsupported-browser")},t=>{throw c.create("indexed-db-unsupported")}),R(M(e),"messaging-sw").getImmediate()}function Le(e,t){return e=M(e),Ke(e,t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Ce();const xe={apiKey:"AIzaSyBHGbErkiS33J_h5Xoanzhl6rC7yWo1R08",authDomain:"kickelo.firebaseapp.com",projectId:"kickelo",storageBucket:"kickelo.firebasestorage.app",messagingSenderId:"1075750769009",appId:"1:1075750769009:web:8a8b02540be5c9522be6d0",measurementId:"G-8V6P1V4Z4G"},je=H(xe),Fe=Be(je);Le(Fe,e=>{const t=e.notification?.title||"New match submitted",n=e.notification?.body||"Join the session now.",i=e.data?.url||"/";self.registration.showNotification(t,{body:n,icon:"/assets/football.svg",data:{url:i}})});self.addEventListener("notificationclick",e=>{e.notification.close();const t=e.notification.data?.url||"/";e.waitUntil(self.clients.openWindow(t))});
