// require 是 electron 自带的函数
// fs 是一个操作文件的库
const fs = require('fs')
const path = require('path')

const log = console.log.bind(console)

const appendHtml = (element, html) => element.insertAdjacentHTML('beforeend', html)

// 把 fs.readdir 封装成 promise 的形式, 方便使用
const readdir = (path) => {
    let p = new Promise((resolve, reject) => {
        fs.readdir(path, (error, files) => {
            if (error !== null) {
                reject(error)
            } else {
                resolve(files)
            }
        })
    })
    return p
}

const e = (selector) => document.querySelector(selector)

const es = (selector) => document.querySelectorAll(selector)

const imgPath = (songName) => {
    let singer = songName.split('-')[1]
    let path = 'images/' + singer + '.jpg'
    return path
}

const templateAudio = (audio) => {
    let songName = audio.split('.m')[0]
    let coverPath = imgPath(songName)
    let t = `
        <li class="gua-song">
            <img class="coverThumbnail" src="${coverPath}" alt="${songName}的封面图片">
            <a href="#" data-href="${audio}" data-img="${coverPath}">${songName}</a>
        </li>
    `
    return t
}

const insertAudio = (audio) => {
    let container = e('#id-ul-song-list')
    let html = templateAudio(audio)
    appendHtml(container, html)
}

const insertAudios = (audios) => {
    for (let a of audios) {
        insertAudio(a)
    }
}

const getPlayList = () => {
    let musics = es('a')
    let list = []
    for (let i = 0; i < musics.length; i++) {
        let music = musics[i]
        let href = music.dataset.href
        let imgSrc = music.dataset.img
        let src = path.join(__dirname, 'audios', href)
        let data = {
            src: src,
            imgSrc: imgSrc,
        }
        list.push(data)
    }
    return list
}

const loadAudio = () => {
    let dir = 'audios'
    let pathname = path.join(__dirname, dir)
    readdir(pathname).then((files) => {
        let audios = files.filter((e) => e.endsWith('.mp3'))
        insertAudios(audios)
    }).then(() => {
        let player = e('#id-audio-player')
        let a = e('a')
        let href = a.dataset.href
        let src = path.join(__dirname, 'audios', href)
        player.src = src
        player.dataset.src = src
        player.play()
        updateCover(a)
        updateSongName(player)
    }).then(() => {
        getPlayList()
    })
}

const updateCover = (element) => {
    let src = element.dataset.img
    let img = e('#cover')
    img.src = src
}

const updateSongName = (player) => {
    let songName = e('.music-name')
    let singer = e('.singer')
    let src = player.dataset.src
    let href = src.split('audios\\')[1].slice(0,-4)
    let audioMessage = href.split('-')
    songName.innerHTML = audioMessage[0]
    singer.innerHTML = audioMessage[1]
}

const actionPlay = (player, self) => {
    let href = self.dataset.href
    // 用 path.join 拼接好 mp3 文件的路径
    let src = path.join(__dirname, 'audios', href)
    updateCover(self)
    player.src = src
    player.dataset.src = src
    player.play()
}


const switchMusic = (player, num) => {
    let list = getPlayList()
    let img = e('#cover')
    let src = player.dataset.src
    let len = list.length
    for (let i = 0; i < len; i++) {
        let music = list[i].src
        if (music === src) {
            let play = e('.button-play')
            let index = (i + num + len) % len
            let imgSrc = list[index].imgSrc

            player.src = list[index].src
            img.src = imgSrc
            player.dataset.src = list[index].src
            play.innerHTML = 'pause'
        }
    }
}

const randomNumber = () => {
    let list = getPlayList()
    let random = Math.random()
    let num = Math.floor(random * (list.length - 1)) + 1
    return num
}

const actionEnded = (player, mode) => {
    log("播放结束, 当前播放模式是", mode)
    // 如果播放模式是 repeat_one 就重新播放
    if (mode === 'repeat_one') {
        player.currentTime = 0
        // player.play()
    } else if (mode === 'repeat') {
        switchMusic(player, 1)
    } else if (mode === 'shuffle'){
        let random = randomNumber()
        log('random', random)
        switchMusic(player, random)
    }
}

const timeConvert = (time) => {
    let int =  Math.floor(time)
    let min = Math.floor(int / 60)
    let sec = int % 60
    if (sec < 10) {
        let t = `${min}:0${sec}    `
        return t
    } else {
        let t = `${min}:${sec}    `
        return t
    }
}

const playerProgress = (player) => {
    let progress = e('.current-progress')
    let dur = player.duration
    let cur = player.currentTime
    let width = (cur / dur) * 100
    progress.style.width = `${width}%`
}

const timeDisplay = (player) => {
    let dur = e('#id-span-duration')
    let duration = player.duration
    dur.innerHTML = timeConvert(duration)
    let current = setInterval(() =>{
        let cur = e('#id-span-current')
        let time =player.currentTime
        cur.innerHTML = timeConvert(time)
        playerProgress(player)
    },200)
    // return current
}

const playOrPause = (player, self) => {
    let playingStatus = self.innerHTML
    if (playingStatus === 'play_arrow') {
        log('播放')
        self.innerHTML = 'pause'
        player.play()
    } else {
        log('暂停')
        self.innerHTML = 'play_arrow'
        player.pause()
    }
}

const playPrevious = (player, self) => {
    let list = getPlayList()
    let mode = player.dataset.mode
    if (list.length !== 0) {
        if (mode === 'repeat') {
            switchMusic(player, -1)
        } else {
            actionEnded(player, mode)
        }
    } else {
        log('播放器未准备完毕')
    }
}

const playNext = (player, self) => {
    let list = getPlayList()
    let mode = player.dataset.mode
    if (list.length !== 0) {
        actionEnded(player, mode)
    } else {
        log('播放器未准备完毕')
    }
}

// 后期加工
const musicTab = (player, self) => {
    self.classList.toggle('tab')
}

const playMode = (player, self) => {
    let mode = ['repeat', 'repeat_one', 'shuffle']
    let present = self.innerHTML
    let index = mode.indexOf(present)
    let int = (index + 1 + mode.length) % mode.length
    self.innerHTML = mode[int]
    player.dataset.mode = mode[int]
}

const playVolume = (player, self) => {
    let vol = self.innerHTML
    let volume = player.volume
    if (vol === 'volume_up') {
        self.innerHTML = 'volume_mute'
        self.dataset.volume = volume
        player.volume = 0
    } else {
        self.innerHTML = 'volume_up'
        let volume = self.dataset.volume
        player.volume = volume
    }
}

const playMenu = (player, self) => {
    let playContainer = e('.play-container')
    let songList = e('.songList')
    playContainer.classList.add('hide')
    songList.classList.remove('hide')
}

const backPlayer = () => {
    let playContainer = e('.play-container')
    let songList = e('.songList')
    playContainer.classList.remove('hide')
    songList.classList.add('hide')
}

const bindEventPlay = (player) => {
    let container = e('#id-ul-song-list')
    container.addEventListener('click', (event) => {
        let self = event.target
        if (self.tagName.toLowerCase() === 'a') {
            event.preventDefault()
            actionPlay(player, self)
        }
    })
}

const bindEventEnded = (player) => {
    player.addEventListener('ended', (event) => {
        let mode = player.dataset.mode
        actionEnded(player, mode)
    })
}

const bindEventCanplay = (player) => {
        let id = setInterval(() => {
            if (player.src !== undefined) {
                player.addEventListener('canplay', (event) => {
                    player.play()
                    timeDisplay(player)
                    updateSongName(player)
                })
                clearInterval(id)
            } else {
                bindEventCanplay(player)
        }
    }, 100)
}

const bindEventControls = (player) => {
    let controls = e('.controls')
    let data = {
        playOrPause,
        playPrevious,
        playNext,
    }
    controls.addEventListener('click', (event) => {
        let self = event.target
        let action = self.dataset.action
        if (action !== undefined) {
            console.log('点到了控制播放按钮')
            data[action](player, self)
        }
    })
}

const bindEventMode = (player) => {
    let bottomBar = e('.bottom-bar')
    let data = {
        musicTab,
        playMode,
        playVolume,
        playMenu,
    }
    bottomBar.addEventListener('click', (event) => {
        let self = event.target
        let action = self.dataset.bar
        if (action !== undefined) {
            data[action](player, self)
        }
    })
}

const bindEventBack = () => {
    let backIcon = e('.backPlayer')
    backIcon.addEventListener('click', (event) => {
        backPlayer()
    })
}

const bindEvents = () => {
    // 找到 audio 标签并赋值给 player
    let player = e('#id-audio-player')
    bindEventPlay(player)
    bindEventEnded(player)
    bindEventControls(player)
    bindEventCanplay(player)
    bindEventMode(player)
    bindEventBack()
}

const __main = () => {
    bindEvents()
    loadAudio()
}

__main()
