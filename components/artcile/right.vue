<template>
  <aside class="content-box article-right">
    <!-- 快捷工具 -->
    <div class="article-right-box clearfix">
      <div class="binary">
        <i class="iconfont icon-shoucang-k"></i>
        <span>收藏本文</span>
      </div>
      <div class="binary">
        <i class="iconfont icon-fenxiang"></i>
        <span>分享本文</span>
      </div>
    </div>
    <!-- 作者 -->
    <div class="article-right-box clearfix">
      <label class="article-right-title">作者</label>
      <div class="author-box">
        <img :src="article.author.img" :alt="article.author.username + '的头像'" class="author-img">
        <div class="author-info ellipsis">
          <div class="author-name" v-text="article.author.username"></div>
          <div class="author-desc ellipsis" v-text="article.author.desc">xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</div>
          <div class="button-box">
            <router-link class="button" :to="'/user/' + article.author.id">查看</router-link>
            <span class="button" @click="not">私聊</span>
          </div>
        </div>
      </div>
    </div>
    <!-- 标签类 -->
    <div class="article-right-box clearfix">
      <label class="article-right-title">标签</label>
      <ul class="article-right-tag">
        <li
          v-for="(item, index) in article.type"
          :key="index"
          v-text="item"
          @click="searchKeyWord(item)"
        ></li>
      </ul>
    </div>
    <!-- 导航树 -->
    <div :class="['article-right-box', 'clearfix', { 'article-right-fixed': navTreeFly }]" ref="navTree">
        <label class="article-right-title">目录</label>
        <ul class="article-right-tree" v-if="tree.length" @click="treeMove">

          <li
            v-for="(item, index) in tree"
            :key="index"
            :class="[{ focus: lookParent == index }]"
            :data-move="index"
          >
            {{ item.tag }}
            <!-- 叶节点 -->
            <ul class="article-right-tree-sub" v-if="item.sub">
              <li
                v-for="(sub, key) in item.sub"
                :key="key"
                :class="['ellipsis', { focus: lookTree == `${index}-${key + 1}` }]"
                :title="sub"
                :data-move="`${index}-${key + 1}`"
                v-html="sub"
              ></li>
            </ul>
          </li>

        </ul>
        <div class="tree-not" v-else>抱歉,本文未找到导航!</div>
    </div>
  </aside>
</template>

<script>
import animation from '~/plugins/animation'
let navTreeTop = 0
let lastUpdate = 0
export default {
  props: ['article'],
  data () {
    return {
      lookParent: '0',
      lookTree: '0',
      treeList: [],
      tree: [],
      navTree: {},
      navTreeFly: false
    }
  },
  mounted () {
    let data = this.article
    console.log(data)
    // 导航树
    if (!data.tree) {
      let h2 = data.content.match(/<(h2|blockquote|li)[^>]*>.*?<\/(h2|blockquote|li)>/ig)
      if (h2) {
        let tree = []
        // 建立树 添加导航点
        let html = data.content
        for (let i = 0, len = h2.length; i < len; i++) {
          const content = h2[i].replace(/(<(\/)?\w+[^>]*>|:|：)/g, '')
          // 添加根
          let className = 'move-'
          if (h2[i].search('h2') > -1) {
            className += tree.push({ tag: content }) - 1
          } else {
            let parent = i - 1
            // 找到父节点
            while (!tree[parent] && parent > 0) {
              parent--
            }
            if (!tree[parent] && parent === -1) {
              tree[0] = {
                tag: data.title
              }
              parent = 0
            }
            // 添加叶节点
            if (!tree[parent].sub) {
              tree[parent].sub = []
            }
            className += parent + '-' + tree[parent].sub.push(content)
          }
          html = html.replace(h2[i], `<div class="${className}">${h2[i]}</div>`)
        }
        this.tree = tree
        data.content = html
      }
    }
    // 滚动监听
    this.tree.length && window.addEventListener('scroll', this.scroll)
    this.$nextTick(() => {
      navTreeTop = this.$refs.navTree.offsetTop
    })
  },

  beforeDestroy () {
    this.tree.length && window.removeEventListener('scroll', this.scroll)
  },

  methods: {
    /* 搜索关键词 */
    searchKeyWord (keyword) {
      this.$store.state.articleModel.keyword = keyword
      this.$router.push({
        path: '/'
      })
    },

    /* 滚动监测 */
    scroll () {
      const date = Date.now()
      if (lastUpdate < date) {
        lastUpdate = date + 50
        const Top = window.scrollY + 150
        const list = this.treeList
        for (let index = 0, len = list.length; index < len; index++) {
          const element = list[index]
          const down = list[index + 1]
          if (Top > element.top && (!down || Top < down.top)) {
            this.lookTree = element.index
            this.lookParent = element.parent
          }
        }
        if (navTreeTop + 80 < window.scrollY && !this.navTreeFly) {
          this.navTreeFly = !0
        } else if (navTreeTop + 80 > window.scrollY && this.navTreeFly) {
          this.navTreeFly = !1
        }
      }
    },

    /* 导航移动 */
    treeMove (e) {
      const target = e.target.dataset.move
      if (target) {
        const node = document.getElementsByClassName('move-' + target)[0]
        if (node && node.offsetTop) {
          const StTop = parseInt(window.scrollY)
          const ToTop = parseInt(node.offsetTop) - StTop
          let WTop = StTop
          // 变相结束时间
          let endDate = Math.abs(ToTop) > 700 ? 700 : Math.abs(ToTop)
          // 移动动画
          animation.create((tw, oldTime) => {
            const time = new Date() - oldTime
            WTop = tw.linear(time, StTop, ToTop, endDate)
            // 动画时间到
            if (endDate - time <= 0) {
              node.className = 'treeFocus'
              setTimeout(() => {
                node.className = 'move-' + target
              }, 1500)
              return false
            }
            window.scrollTo(0, WTop)
            return true
          })
        }
      }
    },

    /* 获取树元素 */
    getTreeElement (el) {
      // 获取导航树
      const treeEl = el.querySelectorAll('div[class^="move-"]')
      let treeList = []
      for (let index = 0, len = treeEl.length; index < len; index++) {
        const item = treeEl[index]
        treeList.push({
          el: item,
          top: item.offsetTop,
          index: item.className.replace('move-', ''),
          parent: item.className.split('-')[1]
        })
      }
      this.treeList = treeList
    },
    not () {
      this.observer.emit('toast', {
        text: '抱歉,该功能未开发!'
      })
    }
  },
  destroyed () {
    this.article.tree && window.removeEventListener('scroll', this.scroll)
  }
}
</script>

<style lang="less">
.article-box {

  .article-right {
    position: absolute;
    width: 300px;
    height: 100%;
    background-color: rgba(250, 250, 250, .8);
    border-radius: 0 5px 5px 0;
  }

  // 右侧
  .article-right-box {
    margin: 20px 0;
    -webkit-user-select: none;
       -moz-user-select: none;
        -ms-user-select: none;
            user-select: none;

    // 二分
    .binary {
      float: left;
      width: 50%;
      font-size: 1.2rem;
      color: #666;
      cursor: pointer;

      &:hover {
        color: #333;
      }

      .iconfont {
        margin: 0 10px;
        font-size: 1.5rem;
        vertical-align: middle;
      }
    }

    .article-right-tag {

      li {
        float: left;
        margin: 5px 5px 5px 10px;
        padding: 5px 15px;
        color: #888;
        background-color: #fff;
        border: 1px solid #ededed;
        border-radius: 5px;
        cursor: pointer;

        &:hover {
          color: #444;
          border: 1px solid #666;
        }
      }
    }

    .article-right-title {
      position: relative;
      margin: 10px;
      font-size: 1.5rem;
      font-weight: bold;
      line-height: 1.2;

      &::after {
        content: '';
        position: absolute;
        left: -20px;
        width: 5px;
        height: 100%;
        border-radius: 0 5px 5px 0;
        background-color: rgba(0, 0, 0, .1);
      }
    }
    .article-right-tree {

      li {
        margin: 5px 20px;
        color: #888;
        cursor: pointer;

        &::before {
          content: '';
          display: inline-block;
          width: 6px;
          height: 6px;
          margin: -2px 15px 0 10px;
          vertical-align: middle;
          border: 3px solid rgba(0, 0, 0, .1);
          border-radius: 50%;
        }

        &:hover,
        &.focus {
          color: #333;

          &::before {
            border: 3px solid #70d7cf;
          }
        }
      }
      .article-right-tree-sub li {
        color: #ccc;

        &::before {
          border: 3px solid rgba(0, 0, 0, .05);
        }

        &:hover,
        &.focus {
          color: #555;

          &::before {
            border: 3px solid #fb8869;
          }
        }
      }
    }
  }

  // 无树
  .tree-not {
    margin: 10px;
    color: #999;
  }

  // 作者
  .author-box {
    display: flex;
    margin-top: 5px;
    padding: 10px;
    background-color: rgba(255, 255, 255, .5);
    border: 1px solid #eee;
    border-radius: 5px;
    transition: .5s;

    .author-img {
      width: 40px;
      height: 40px;
      margin-right: 10px;
      border-radius: 50%;
      flex: 1;
    }

    .author-info {
      width: 100%;
    }

    .author-name {
      font-weight: bold;
      color: #555;
    }

    .author-desc {
      font-size: .8em;
      color: #888;
    }

    &:hover {
      background-color: #fff;
    }

    .button-box {
      display: flex;
      margin-top: 10px;
      justify-content: flex-end;
      font-size: .8em;
      color: #bbb;

      .button {
        margin: 0 10px;
        padding: 3px 10px;
        border: 1px solid currentColor;
        border-radius: 20px;
      }
    }
  }

  // 导航
  .article-right-fixed {
    position: fixed;
    width: 280px;
    top: 50px;
  }

  blockquote,
  h2,
  .treeFocus {
    -webkit-transition: 1s;
            transition: 1s;
  }

  .treeFocus {
    -webkit-transform: translateX(-20px);
            transform: translateX(-20px);

    h2 {
      color: #eb3a42;
    }

    blockquote {
      color: #fff;
      border-left: 8px solid #ad292f;
      background-color: #eb3a42;
    }
  }

  // 响应
  @media screen and (max-width: 1100px) {
    .content-box {

      &.article-index {
        width: 100%;
      }

      &.article-right {
        display: none;
      }
    }
  }
}
</style>
