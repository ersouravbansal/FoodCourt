import { Link } from "@remix-run/react";
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import TagManager from "react-gtm-module";

// import { browserName, browserVersion, osName } from "react-device-detect";
import style from "~/css-dist/VideoPlayer.min.css";
import ads from "~/hooks/useAds";
import VideoPlayer from "~/hooks/useVideoPlayer";
import useEnvStore from "~/stores/env_variables";
import useStore from "~/stores/utilstore";

export const link = () => [{ rel: "stylesheet", href: style }];

function VideoSlideItem(props: any) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [getUrl, setGetUrl] = useState("None");
  const progressRef = useRef(null);
  const snapshotRef = useRef(null);
  const videoElement = useRef<HTMLVideoElement>(null);
  const videoElementSecond = useRef<HTMLVideoElement>(null);
  const expscreen = useStore((state) => state.expscreen);
  const setExpscreen = useStore((state) => state.setExpscreen);

  const urlupdate = useStore((state) => state.urlupdate);
  const setUrlupdate = useStore((state) => state.setUrlupdate);
  const basepath = useEnvStore((state) => state.basePath);
  const setCmntInfo = useStore((state) => state.setCmntInfo);

  const {
    playerState,
    togglePlay,
    handleOnTimeUpdate,
    handleOnMetaLoaded,
    handleVideoProgress,
    toggleMute,
    playVideo,
    pauseVideo,
    muteVideo,
    unMuteVideo,
    fastForward,
    revert,
    onSliderMove,
    onSliderOut,
    formatTime,
  } = VideoPlayer(videoElement, videoElementSecond, progressRef, snapshotRef);
  //console.log('my snap-->', playerState.snapshots)
  //console.log("content playing state->"+playerState.isPlaying)
  //console.log("hover and manual slider times:-> ", playerState.hoverTime, playerState.progress)
  //console.log((playerState.hoverTime = 0) ? videoElement.current?.currentTime : playerState.hoverTime)
  const adElement = useRef(null);
  const {
    vdControlAllow,
    checkAutoplaySupport,
    isAdPlaying,
    pauseAd,
    adButton,
    playAdButton,
    muteAdBtn,
    muteAdButton,
    unmuteAdBtn,
  } = ads(
    adElement,
    videoElement,
    playVideo,
    pauseVideo,
    muteVideo,
    unMuteVideo,
    props.link,
    props.urltitle,
    props.videoID,
    props.category,
    props.channel_id
  );
  const adStateManagement = () => {
    if (isAdPlaying == false || vdControlAllow.current == true) {
      togglePlay();
    }
  };
  const observeVideo = useRef(false);
  const FSEvent = () => {
    TagManager.dataLayer({
      dataLayer: {
        event: "Full Screen Mode ON/OFF",
        eventCategory: "Screen Size",
        eventAction: "Toggle Full Screen",
        eventLabel: "FS Toggle",
      },
    });
  };
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (props.index == 0) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [props.index, visible]);

  useEffect(() => {
    const originUrl = window.location.origin;
    const currentUrl =
      originUrl +
      `${basepath}/videos/` +
      cleanUp(props.urltitle).toLowerCase() +
      "-" +
      props.videoID;
    // console.log("current url:", currentUrl);
    const updatedUrl = encodeURIComponent(currentUrl);
    setGetUrl(updatedUrl);

    // console.log(
    //   "HLS js supported ",
    //   Hls.isSupported(),
    //   videoElement.current,
    //   props.hlssrc
    // );

    if (Hls.isSupported() && props.hlssrc) {
      var hls = new Hls();
      hls.attachMedia(videoElement.current);
      hls.on(Hls.Events.MEDIA_ATTACHED, function () {
        hls.loadSource(props.hlssrc);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          // console.log("HLS Media Loaded successfully!!!!!!");
        });
      });
    }
  }, [props.urltitle, props.videoID, props.hlssrc, basepath]);

  useEffect(() => {
    // console.log("videoslideitem useeffect running");
    const options = {
      rootMargin: "0px",
      threshold: [0.75],
    };
    let currentVideoElement = videoElement.current;
    const handlePlay = (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      // console.log("expscreen:", expscreen);
      if (expscreen == false) {
        if (entry.isIntersecting) {
          if (observeVideo.current == false) {
            observeVideo.current = true;
            if (urlupdate == true) {
              document.location.hash =
                cleanUp(props.urltitle).toLowerCase() + "-" + props.videoID;
            }
            // playAdButton();
            // checkAutoplaySupport();
            if (isAdPlaying == false || vdControlAllow.current == true) {
              playVideo();
            }
          }
        } else {
          pauseAd();
          pauseVideo();
          if (observeVideo.current == true) {
            observeVideo.current = false;
          }
        }
      }
    };
    let observer = new IntersectionObserver(handlePlay, options);
    if (currentVideoElement) observer.observe(currentVideoElement);
    return () => {
      if (currentVideoElement) observer.unobserve(currentVideoElement);
      observer.disconnect();
      console.log("this is videoslideitem useeffect cleanup.");
    };
  }, [
    playAdButton,
    checkAutoplaySupport,
    isAdPlaying,
    playVideo,
    pauseVideo,
    props.videoID,
    pauseAd,
    props.urltitle,
    vdControlAllow,
    expscreen,
    urlupdate,
  ]);
  // const copy = () => {
  //   navigator.clipboard.writeText(window.location.href);
  // };
  const cleanUp = (st) => {
    return st
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  };
  let timeoutControl: string | number | NodeJS.Timeout | undefined;
  let containerRef = useRef(null);
  let expandIconRef = useRef(null);
  let fsRef = useRef(null);
  const toggleFs = () => {
    if (isFullScreen) {
      expandIconRef.current.classList.remove("js_VdEl_ic-exp");
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } else {
      expandIconRef.current.classList.add("js_VdEl_ic-exp");
      if (fsRef.current.requestFullscreen) fsRef.current.requestFullscreen({ navigationUI: "show" });
      else if (fsRef.current.webkitRequestFullscreen)
        fsRef.current.webkitRequestFullscreen({ navigationUI: "show" });
      else if (fsRef.current.msRequestFullScreen)
        fsRef.current.msRequestFullScreen({ navigationUI: "show" });
      else if (fsRef.current.mozRequestFullScreen)
        fsRef.current.mozRequestFullScreen({ navigationUI: "show" });
    }
  };
  const mouseStopped = () => {
    if (!playerState.isPlaying) {
      containerRef.current.classList.add("js_seek-vis");
    } else {
      containerRef.current.classList.remove("js_seek-vis");
    }
  };
  const onHover = () => {
    //console.log("i'm hovered", containerRef.current)
    clearTimeout(timeoutControl);
    timeoutControl = setTimeout(mouseStopped, 3000);
    containerRef.current.classList.add("js_seek-vis");
  };
  const onHoverOut = () => {
    //console.log("i'm hovered Out")
    if (playerState.isPlaying) {
      containerRef.current.classList.remove("js_seek-vis");
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        id={"/#" + props.videoID}
        className={"FP_crd1 VdSup-Lst_li"}
      >
        {" "}
        <div className="VdSup-Lst-crd ">
          <div className="VdSup-Lst-bg-cat">{props.show}</div>
          <div className="VdSup-Lst-bg-cat VdSup-Lst-bg-cat-rt">
            {props.category}
          </div>
          <div className="VdSup-Lst-a VdSup-Lst-act">
            <div
              onMouseMove={onHover}
              onMouseOut={onHoverOut}
              ref={fsRef}
              className={
                "VdSup-Lst_vd-wr " +
                (isAdPlaying && !vdControlAllow.current
                  ? "js_dSup_act-ad"
                  : "") +
                (isFullScreen ? "fs_id" : "")
              }
            >
              <div
                className={
                  (isFullScreen ? "fs_cls" : "") + isAdPlaying
                    ? "hideBtn"
                    : "js_ply-Vol"
                }
              ></div>
              {/* Video container */}
              <div
                className={(isFullScreen ? "fs_cls " : "") + "VdSup-Lst_img "}
              >
                <div
                  className="img-gr"
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <video
                    className="playVideo"
                    id="video"
                    loop
                    playsInline
                    muted
                    // autoPlay
                    preload="metadata"
                    //webkit-playsinline="true"
                    ref={videoElement}
                    onTimeUpdate={handleOnTimeUpdate}
                    onLoadedMetadata={handleOnMetaLoaded}
                    src={props.vidsrc}
                    onPause={() => {
                      console.log("Video Pause is Triggered");
                    }}
                    onPlay={() => {
                      console.log("Video Play is Triggered");
                    }}
                  ></video>
                  <div className="VdEl_cn">
                    {/* Mute / Unmute */}
                    <div
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleMute();
                      }}
                    >
                      {playerState.isMuted ? (
                        <>
                          <div
                            className={" cht_mut cht_mut-ac"}
                            style={{
                              width:
                                props.index == 0 && visible ? "135px" : "29px",
                            }}
                          >
                            <i className=" cht_mut-ic"></i>
                            {props.index == 0 && visible ? (
                              <span className="cht_mut-tx">Tap to UnMute</span>
                            ) : null}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className=" cht_mut cht_mut-act">
                            <i className="cht_un_mut-ic"></i>
                            <span className="cht_mut-tx"></span>
                          </div>
                        </>
                      )}
                    </div>
                    {/* Next Prev, Related Button  */}
                    <div className="VdEl_mid-wr">
                      <div className="VdEl_btn-wr">
                        {/* Next  */}
                        <div
                          className="VdEl_nx-pr vj-icn vj-vod-prev VdEl_ripl VdEl_ripl-lgt"
                          onClick={(event) => {
                            event.stopPropagation();
                            revert();
                          }}
                        >
                          <svg className="vj_icn vj_re-10">
                            <use xlinkHref="#vj_re-10" />
                          </svg>
                        </div>
                        {/* Play / Pause  */}
                        <div className="VdEl_sk_pp-btn">
                          <div
                            className="VdEl_sk_pp-btn VdEl_ripl VdEl_ripl-lgt"
                            onClick={() => {
                              adStateManagement();
                            }}
                          >
                            {playerState.isPlaying ? (
                              <svg className=" vj_icn vj_pause">
                                <use xlinkHref="#vj_pause" />
                              </svg>
                            ) : (
                              <svg className=" vj_icn vj_play">
                                <use xlinkHref="#vj_play" />
                              </svg>
                            )}
                          </div>
                        </div>
                        {/* Perv  */}
                        <div
                          className="VdEl_nx-pr vj-icn vj-vod-next VdEl_ripl VdEl_ripl-lgt"
                          onClick={(event) => {
                            event.stopPropagation();
                            fastForward();
                          }}
                        >
                          <svg className="vj_icn vj_fw-10">
                            <use xlinkHref="#vj_fw-10" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    {/* Play / Pause, Time, Progress Bar*/}
                    {/* Range Slider Ends */}
                    {/* new range slider */}
                    <div className="VdEl_lod-rw">
                      {/* Play / Pause, Time, Progress Bar */}
                      <div className="VdEl_lod-cn">
                        {/* Progress Bar  */}
                        <div className="VdEl_lod-wrp">
                          {
                            <input
                              className="amount-progress"
                              ref={progressRef}
                              step="any"
                              type="range"
                              onMouseMove={(e) => onSliderMove(e)}
                              onMouseOut={(e) => onSliderOut(e)}
                              min="0"
                              max={videoElement.current?.duration || "0"}
                              value={videoElement.current?.currentTime || "0"}
                              onChange={(e) => handleVideoProgress(e)}
                              onClick={() =>
                                (playerState.isPlaying = !playerState.isPlaying)
                              }
                            />
                          }

                          <div ref={snapshotRef} className="snapshotContainer">
                            <img
                              crossOrigin="anonymous"
                              src={playerState.snapshots}
                              alt=""
                              className="snapshotImg"
                            />
                            <div className="snapshotTime">
                              {formatTime(playerState.hoverTime)}
                            </div>
                          </div>

                          <video
                            className="dummyVideoElement"
                            id="video"
                            loop
                            playsInline
                            muted
                            crossOrigin="anonymous"
                            //webkit-playsinline="true"
                            ref={videoElementSecond}
                            onTimeUpdate={handleOnTimeUpdate}
                            onLoadedMetadata={handleOnMetaLoaded}
                            src={props.vidsrc}
                            onPause={() => {
                              console.log("Video Pause is Triggered");
                            }}
                            onPlay={() => {
                              console.log("Video Play is Triggered");
                            }}
                          ></video>
                          {/* Progress Bar */}
                          {/* removed html code for progressbar*/}
                          {/* Time */}
                          <div className="VdEl_sk-tm">
                            {formatTime(videoElement.current?.currentTime)} /{" "}
                            {formatTime(videoElement.current?.duration)}
                          </div>
                        </div>
                        {/* Play / Pause */}
                        <div
                          className="VdEl_ic-exp-cn"
                          onClick={(event) => {
                            setExpscreen(!expscreen);
                            event.stopPropagation();
                            setIsFullScreen(!isFullScreen);
                            toggleFs();
                            FSEvent();
                          }}
                        >
                          <div ref={expandIconRef} className="VdEl_ic-exp-wr">
                            <svg className="VdEl_ic-exp VdEl_ic-exp1 vj_icn vj_vod-vr-full">
                              <use xlinkHref="#vj_vod-vr-full" />
                            </svg>

                            <svg className="VdEl_ic-exp VdEl_ic-exp2 vj_icn vj_vod-vr-fsc">
                              <use xlinkHref="#vj_vod-vr-fsc" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* end new range slider */}
                    {/* VOD Share Overlay  */}
                    <div className="VdEl_ovl"></div>
                  </div>
                </div>
              </div>
              {/* ADD container "VdSup_ad_cn"*/}
              <div className={"VdSup_ad_cni " + (isFullScreen ? "fs_cls" : "")}>
                <div id="adContainer" className="adstyle" ref={adElement}>
                  {/* vol code starts here */}
                  {muteAdButton ? (
                    <div
                      style={{
                        margin: "100% 0 50% 48%",
                        height: "40px",
                        width: "40px",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "10%",
                          right: "-10%",
                          transform: "translate(-50%,-50%)",
                        }}
                      >
                        <button
                          className="ad_bt"
                          onClick={(event) => {
                            event.stopPropagation();
                            unmuteAdBtn();
                          }}
                        >
                          Turn on Sound
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        margin: "100% 0 50% 48%",
                        height: "40px",
                        width: "40px",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "10%",
                          right: "-5%",
                          transform: "translate(-50%,-50%)",
                        }}
                      >
                        <button
                          className="ad_bt"
                          onClick={(event) => {
                            event.stopPropagation();
                            muteAdBtn();
                          }}
                        >
                          Mute
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Volume code ends here */}
                  {adButton ? (
                    <div
                      style={{
                        margin: "100% 0 50% 48%",
                        height: "40px",
                        width: "40px",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "5%",
                          right: "-5%",
                          transform: "translate(-50%,-50%)",
                        }}
                      >
                        <button
                          className="ad_bt"
                          onClick={(event) => {
                            event.stopPropagation();
                            playAdButton();
                          }}
                        >
                          Play Ad
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        margin: "100% 0 50% 48%",
                        height: "40px",
                        width: "40px",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "5%",
                          right: "-5%",
                          transform: "translate(-50%,-50%)",
                        }}
                      >
                        <button
                          className="ad_bt"
                          onClick={(event) => {
                            event.stopPropagation();
                            pauseAd();
                          }}
                        >
                          Pause Ad
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="controls ">
                  <div className="actions"></div>
                </div>
              </div>
            </div>
            <div className="VdSup-Lst_txt-wrp ">
              {/* Post Tags */}
              <div className="VdSup-Lst_bt">
                <div className="VdSup-lst_Htx ">
                  <span className="VdSup-lst_Htx-tx ptr_cur">
                    {props.title}
                  </span>
                  {/*<div className="VdSup-lst_Htx-aup">
                                                        <svg className="vj_icn vj_arrow-up VdSup-lst_Htx-aup-ic">
                                                        <use xlink:href="#vj_arrow-up"></use>
                                                        </svg>
                                                    </div>*/}
                </div>
                {/* Social share */}
                <div className="crd_shr">
                  <svg className="vj_icn vj_share">
                    <use xlinkHref="#vj_share" />
                  </svg>
                  <div className="crd_shr-ss">
                    <div className="crd_shr-pg">
                      <a
                        href={`https://www.facebook.com/sharer.php?u=${getUrl}&amp;text=${props.title}`}
                        className="crd_shr-lk facebook ttp"
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        data-platform="facebook"
                      >
                        <svg className="vj_icn vj_facebook-fill">
                          <use xlinkHref="#vj_facebook-fill" />
                        </svg>
                        <div className="tip on-bottom">
                          <div className="tip_wrp">facebook</div>
                        </div>
                      </a>
                      <a
                        href={`https://twitter.com/intent/tweet?url=${getUrl}&amp;text=${props.title}`}
                        className="crd_shr-lk twitter ttp"
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        data-platform="twitter"
                      >
                        <svg className="vj_icn vj_twitter-fill">
                          <use xlinkHref="#vj_twitter-fill" />
                        </svg>
                        <div className="tip on-bottom">
                          <div className="tip_wrp">twitter</div>
                        </div>
                      </a>
                      <a
                        href={`https://api.whatsapp.com/send?text=${props.title} - ${getUrl}?via=whatsapp`}
                        className="crd_shr-lk whatsapp ttp"
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        data-platform="whatsapp"
                      >
                        <svg className="vj_icn vj_whatsapp-fill">
                          <use xlinkHref="#vj_whatsapp-fill" />
                        </svg>
                        <div className="tip on-bottom">
                          <div className="tip_wrp">whatsapp</div>
                        </div>
                      </a>
                      <a
                        href={`https://www.reddit.com/r/technology/submit?url=${getUrl}`}
                        className="crd_shr-lk reddit ttp"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <svg className="vj_icn vj_reddit-fill">
                          <use xlinkHref="#vj_reddit-fill" />
                        </svg>
                        <div className="tip on-bottom">
                          <div className="tip_wrp">reddit</div>
                        </div>
                      </a>

                      <span
                        className="crd_shr-lk snapchat ttp"
                        data-share-url={`${props.titlel}?snapchat=1`}
                        data-size="large"
                        data-text="false"
                        data-platform="snapchat"
                        onClick={() => {
                          window.open(
                            `https://www.snapchat.com/scan?attachmentUrl=${getUrl}?snapchat=1`,
                            "_blank",
                            "toolbar=yes,scrollbars=yes,resizable=yes,top=400,left=400,width=600,height=600"
                          );
                        }}
                      >
                        <svg className="vj_icn vj_snapchat-fill">
                          <use xlinkHref="#vj_snapchat-fill" />
                        </svg>
                        <div className="tip on-bottom">
                          <div className="tip_wrp">Snapchat</div>
                        </div>
                      </span>
                    </div>
                  </div>
                </div>
                {/* https%3A%2F%2Fwww.ndtv.com%2Fvideo%2Fnews%2Fnews%2Fno-one-should-be-allowed-japan-pm-on-ukraine-pm-modi-by-his-side-624953 */}
                <div
                  className="VdSup-Lst_Ic-cmt cmt-ac cmnt"
                  onClick={(e) => {
                    const originUrl1 = window.location.href;
                    const currentUrl1 =
                      originUrl1 +
                      `${basepath}/videos/` +
                      cleanUp(props.urltitle).toLowerCase() +
                      "-" +
                      props.videoID;
                    const updatedUrl1 = encodeURIComponent(currentUrl1);

                    setCmntInfo(props.videoID, props.title, updatedUrl1);

                    // $(".cmt-ac").click(function () {
                    window.$("body").addClass("js-op-cmt");
                    setTimeout(function () {
                      window.$(".nav-trigger").removeClass("js-nav-open");
                    }, 3000);

                    //--- drop animation
                    var pos = window.$(e.target).offset();
                    window.$(".drp-wrp").css({
                      top: pos.top + "px",
                      right: 0 + "px",
                    });
                    window.$(".cmt-cnt").fadeIn(0);
                    window.$(".ovl").fadeIn(0).addClass("js-ovl");
                    // });
                  }}
                >
                  <svg className="vj_icn vj_comment VdSup-Lst_Ic-cmt-svg">
                    <use xlinkHref="#vj_comment" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <script src="js/testingFp.js" /> */}
    </>
  );
}

export default VideoSlideItem;
