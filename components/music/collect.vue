<template>
  <div class="qq-single">
    <div class="single" v-if="QQSingle">
      <div v-show="QQSingle[1] && style.length">
        <span class="qqtz">爱 好 分 析</span>
        <div class="qqEcharts" ref="qqEcharts"></div>
      </div>
      <button class="update-single" v-html="updateSingleData" @click="updateSingle"></button>
      <ul class="list" @click="singleList">
        <li v-for="(item, index) in QQSingle[0].disslist" :key="index">
          <img :src="item.diss_cover" :alt="item.diss_name + '封面'">
          <span class="ellipsis" v-text="item.diss_name"></span>
          <span class="ellipsis">{{ item.song_num }} 首音乐</span>
          <div class="loading" :data-index="index">
            <i class="iconfont icon-geci"></i>
          </div>
        </li>
      </ul>
    </div>
    <div class="not-QQSingle" v-else>
      未搜索到QQ音乐歌单数据,请前往 '设置页' 绑定QQ 或者 <span class="updateData" @click="updateData">刷新</span>
    </div>
    <!-- 歌单内容 -->
    <div class="qq-single-song" v-if="single.song_list">
      <i class="iconfont icon-wrong" @click="clearSingle"></i>
      <img class="single-logo" :src="single.logo" alt="歌单封面">
      <span class="ellipsis single-title" v-text="single.diss_name"></span>
      <span class="single-create">创建日期: {{ single.create_time }}</span>
      <span class="single-num">歌曲数量: {{ single.total_song_num }}</span>
      <button class="download-all" v-if="single.song_list.length" @click="downloadAll">
        <i class="iconfont icon-xiazai"></i>{{ downloadState }}
      </button>
      <ul :class="['download-list', { 'download-list-show': download && downloadtoggle }]" @click="selectDownload">
        <li v-for="(item, index) in download" :key="index" :data-down="index">
          <span>下载 {{ index }}</span>
          <span class="right">{{ item.name || "" }}</span>
        </li>
        <li style="text-align: center" @click="downloadtoggle = !1">
          关闭
        </li>
      </ul>

      <ul class="song-list">
        <li class="clearfix" v-for="(item, index) in single.song_list" :key="index" @click="playSong" :data-id="index">
          <span class="song-name" v-html="item.songnames"></span>
          <span class="song-singer">{{ item.singers }}</span>
          <span class="song-lyric">{{ item.albumname }}</span>
          <i class="iconfont icon-caidan"></i>
          <span class="song-inter">{{ item.interval }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
// let echarts = require('echarts/lib/echarts')
import echarts from 'echarts'
export default {
  data () {
    return {
      QQSingle: null,
      updateSingleData: '',
      single: {},
      style: [],
      download: {},
      downloadState: '下载全部',
      downloadtoggle: !1
    }
  },
  created () {
    this.updateData()
  },
  mounted () {
    this.updateEcharts()
  },
  methods: {
    /**
     * 更新歌单数据
     */
    updateSingle () {
      if (this.QQSingle[0].uin) {
        this.updateSingleData = `<i class="iconfont icon-slm icon-slm-loading"></i>更新${this.QQSingle[0].uin}的歌单中...!`
        this.$axios
          .get('api/Music', {
            data: {
              fun: 'QQSingle',
              qq: this.QQSingle[0].uin
            }
          })
          .then(res => {
            if (res.data[0].code === 0) {
              this.QQSingle = res.data
              localStorage.setItem('QQSingle', JSON.stringify(res.data))
              this.updateSingleData = '更新完毕![如需再次更新请刷新网页]'
            } else {
              this.updateSingleData = '更新失败,错误的数据!'
            }
          })
      } else {
        this.updateSingleData = 'QQ号分析失败!'
      }
    },

    /**
     * 歌单列表点击事件委托
     */
    singleList (e) {
      const id = e.target.dataset.index
      const single = this.QQSingle[0].disslist
      if (single[id]) {
        this.single = {
          create_time: '0000-00-00',
          diss_name: '获取歌单中...',
          logo: '//y.gtimg.cn/mediastyle/global/img/playlist_300.png',
          song_list: [],
          total_song_num: 0
        }
        this.download = {}
        this.$axios.get('api/Music', {
          data: {
            fun: 'getSingle',
            id: single[id].id,
            qq: this.QQSingle[0].uin
          }
        })
          .then(res => {
            console.log('----------------')
            console.log(res)
            let song = res.song_list
            if (!res.msg) {
              for (let i = 0, l = song.length; i < l; i++) {
                let val = song[i]
                // 避免重复计算
                if (val.songnames) break
                if (val.songname === val.albumname) {
                  val.albumname = ''
                }
                // 歌手
                let singer = ''
                for (let j = 0, l = val.singer.length; j < l; j++) {
                  singer += val.singer[j].name + '/'
                }
                val.singers = singer.substring(0, singer.length - 2)
                // 播放时间
                !val.songnames && (val.songnames = val.songname)
              }
              this.single = res
            } else {
              this.single.diss_name = res.msg
              setTimeout(() => {
                this.single = []
              }, 2000)
            }
          })
      }
    },

    /**
     * 清空歌单信息
     */
    clearSingle () {
      this.single = {}
    },

    /**
     * 下载全部音乐
     */
    downloadAll () {
      const Music = this.$store.state.Music
      // batch
      this.downloadState = '获取下载数据中...'
      this.$axios.get('api/Music', {
        data: {
          fun: 'SingleDownload',
          code: this.single.batch.replace('=', '-')
        }
      })
        .then(res => {
          const keys = {
            DTS: 'VIP专属音质',
            FLAC: '无损音质',
            APE: '无损音质',
            MP3_320: '高清音质',
            MP3_128: '流畅音质'
          }
          this.downloadState = '请选择一种下载音乐品质!'
          this.downloadtoggle = !0
          this.download = res
          Music.allDownloadStart(!0)
        })
    },

    /**
     * 下载一种选项
     */
    selectDownload (e) {
      const down = e.target.dataset.down
      let download = this.download[down]
      const Music = this.$store.state.Music
      const single = this.single.song_list
      if (download) {
        const url = download.url
        if (url) {
          let list = Object.keys(download)
          download = list.splice(0, list.length - 2).map(v => {
            return url.replace('{id}', download[v])
          })
        }
        for (let i = 0, l = download.length; i < l; i++) {
          Music.addDownload({
            name: single[i].songnames,
            src: download[i]
          })
        }
        Music.allDownloadStart(!0)
      }
    },

    /**
     * 播放列表内的音乐
     */
    playSong (e) {
      const id = e.target.dataset.id
      if (id) {
        this.$store.state.Music.loadMusic(this.single.song_list[id].albummid, true)
      }
    },

    /**
     * 刷新数据
     */
    updateData () {
      // 检测QQ歌单是否绑定
      let QQSingle = localStorage.getItem('QQSingle')
      if (QQSingle) {
        QQSingle = JSON.parse(QQSingle)
        QQSingle[1] = JSON.parse(QQSingle[1])
        let style = []
        for (let i of QQSingle[1].data.genrelist) {
          style.push({
            value: i.percent,
            name: i.genre
          })
        }
        this.style = style
        this.updateSingleData = `更新${QQSingle[0].name}的歌单数据`
        this.QQSingle = QQSingle
        this.updateEcharts()
      }
    },

    updateEcharts () {
      const qqEl = this.$refs.qqEcharts

      if (qqEl) {
        const qqEcharts = echarts.init(qqEl)
        qqEcharts.setOption({
          color: ['#dd6b66', '#759aa0', '#e69d87', '#8dc1a9', '#ea7e53', '#eedd78', '#73a373', '#73b9bc', '#7289ab', '#91ca8c', '#f49f42'],
          series: [
            {
              name: '音乐风格',
              type: 'pie',
              radius: '50%',
              selectedMode: 'single',
              selectedOffset: 30,
              clockwise: true,
              label: {
                normal: {
                  textStyle: {
                    color: '#fff'
                  }
                }
              },
              data: this.style
            }
          ]
        })
      }
    }
  }
}
</script>

<style lang="less">
  .qq-single {
    height: 100%;
    color: #ccc;
    background-color: rgba(0, 0, 0, .3);

    .qqtz {
      display: block;
      width: 100%;
      text-align: center;
      font-size: 1.5rem;
      font-weight: bold;
      color: #fff;
      transform: translateY(20px);
    }
    .qqEcharts {
      width: 100%;
      height: 300px;
      color: #fff;
    }

    .updateData {
      margin-left: 5px;
      text-decoration: underline;
      color: #ccc;
      cursor: pointer;
    }

      // 音乐列表
    .qq-single-song {
      position: absolute;
      overflow-y: scroll;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, .9);

      .single-logo {
        display: block;
        width: 50%;
        margin: 10px auto;
        border-radius: 10px;
      }
      .single-title {
        margin: 10px 0;
        font-size: 1.3rem;
        font-weight: bold;
        text-align: center;
      }
      .single-create,
      .single-num {
        display: block;
        margin: 5px 20px;
        color: #888;
      }
      .icon-wrong {
        position: absolute;
        right: 0;
        margin: 10px;
        font-size: 2rem;
        color: rgba(255, 255, 255, .4);
      }
    }
    .song-list li span {
      pointer-events: none;
    }

    // 更新歌单
    .update-single,
    .download-all {
      display: block;
      width: 80%;
      margin: 10px auto 0;
      border: 0;
      border-radius: 10px;
      box-sizing: border-box;
      padding: 10px;
      font-size: 1.2rem;
      background-color: rgba(255, 255, 255, .6);
      cursor: pointer;
      i {
        margin-right: 10px;
      }
    }
    // 下载按钮
    .download-list {
      overflow: hidden;
      width: 60%;
      max-height: 0;
      margin:  0 auto;
      border-radius: 0 0 10px 10px;
      padding: 0 10px;
      color: #333;
      background-color: rgba(255, 255, 255, .6);
      transition: 1s;
      li {
        padding: 5px 0;
        border-top: 1px solid #888;
        user-select: none;
        cursor: pointer;
        &:hover {
          color: #fff;
        }
        span {
          pointer-events: none;
        }
      }
    }
    .download-list-show {
      max-height: 40vh;
    }
    // 歌单列表
    .single {
      position: relative;
      overflow-y: scroll;
      height: 100%;
      .list {
        li {
          float: left;
          position: relative;
          width: 30%;
          margin: 10px 1.6%;
          cursor: pointer;
          &:hover .loading {
            opacity: 1;
          }
        }
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          position: absolute;
          top: 0;
          width: 100%;
          height: 100%;
          border-radius: 5px;
          color: #fff;
          background-color: rgba(0, 0, 0, .8);
          opacity: 0;
          transition: .5s;
        }
        .icon-geci {
          font-size: 50px;
          pointer-events: none;
        }
        img {
          width: 100%;
          border-radius: 5px;
        }
      }
    }

    // 未搜索到歌单
    .not-QQSingle {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      color: #999;
    }
    .right {
      float: right;
    }
  }
</style>
