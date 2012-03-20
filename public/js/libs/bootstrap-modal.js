/* =========================================================
 * bootstrap-modal.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#modals
 * =========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */
!function(e){var a=function(i,h){this.options=h;this.$element=e(i).delegate('[data-dismiss="modal"]',"click.dismiss.modal",e.proxy(this.hide,this))};a.prototype={constructor:a,toggle:function(){return this[!this.isShown?"show":"hide"]()},show:function(){var h=this;if(this.isShown){return}e("body").addClass("modal-open");this.isShown=true;this.$element.trigger("show");d.call(this);c.call(this,function(){var i=e.support.transition&&h.$element.hasClass("fade");!h.$element.parent().length&&h.$element.appendTo(document.body);h.$element.show();if(i){h.$element[0].offsetWidth}h.$element.addClass("in");i?h.$element.one(e.support.transition.end,function(){h.$element.trigger("shown")}):h.$element.trigger("shown")})},hide:function(i){i&&i.preventDefault();if(!this.isShown){return}var h=this;this.isShown=false;e("body").removeClass("modal-open");d.call(this);this.$element.trigger("hide").removeClass("in");e.support.transition&&this.$element.hasClass("fade")?g.call(this):f.call(this)}};function g(){var h=this,i=setTimeout(function(){h.$element.off(e.support.transition.end);f.call(h)},500);this.$element.one(e.support.transition.end,function(){clearTimeout(i);f.call(h)})}function f(h){this.$element.hide().trigger("hidden");c.call(this)}function c(k){var j=this,i=this.$element.hasClass("fade")?"fade":"";if(this.isShown&&this.options.backdrop){var h=e.support.transition&&i;this.$backdrop=e('<div class="modal-backdrop '+i+'" />').appendTo(document.body);if(this.options.backdrop!="static"){this.$backdrop.click(e.proxy(this.hide,this))}if(h){this.$backdrop[0].offsetWidth}this.$backdrop.addClass("in");h?this.$backdrop.one(e.support.transition.end,k):k()}else{if(!this.isShown&&this.$backdrop){this.$backdrop.removeClass("in");e.support.transition&&this.$element.hasClass("fade")?this.$backdrop.one(e.support.transition.end,e.proxy(b,this)):b.call(this)}else{if(k){k()}}}}function b(){this.$backdrop.remove();this.$backdrop=null}function d(){var h=this;if(this.isShown&&this.options.keyboard){e(document).on("keyup.dismiss.modal",function(i){i.which==27&&h.hide()})}else{if(!this.isShown){e(document).off("keyup.dismiss.modal")}}}e.fn.modal=function(h){return this.each(function(){var k=e(this),j=k.data("modal"),i=e.extend({},e.fn.modal.defaults,k.data(),typeof h=="object"&&h);if(!j){k.data("modal",(j=new a(this,i)))}if(typeof h=="string"){j[h]()}else{if(i.show){j.show()}}})};e.fn.modal.defaults={backdrop:true,keyboard:true,show:true};e.fn.modal.Constructor=a;e(function(){e("body").on("click.modal.data-api",'[data-toggle="modal"]',function(l){var k=e(this),i,h=e(k.attr("data-target")||(i=k.attr("href"))&&i.replace(/.*(?=#[^\s]+$)/,"")),j=h.data("modal")?"toggle":e.extend({},h.data(),k.data());l.preventDefault();h.modal(j)})})}(window.jQuery);
