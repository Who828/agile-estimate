(ns cljs-intro.estimate
  (:require
    [domina :as d]
    [clojure.browser.event :as event]
    [dommy.template :as template]))

(def stats-button (d/by-id "stats-btn"))

(defn all-estimate [amount point-cap stories choices]
  (cond (and (= amount 0) (= stories 0)) [choices]
    (or (< amount 0) (= point-cap 0) (= stories 0)) `()
    :else (into (all-estimate (- amount point-cap) point-cap (- stories 1) (conj choices point-cap))
      (all-estimate amount (- point-cap 1) stories choices))))

(defn estimate [amount stories]
  (let  [coll (all-estimate amount 3 stories [])]
  (if (empty? coll)
    []
  (shuffle (rand-nth coll)))))

(defn humanize-number-of-stories [stories]
  (cond
   (= stories 0) "no stories"
   (= stories 1) "1 story"
   :else (str stories " stories")))

(defn display-message []
  (let [velocity (js/parseInt (d/value (d/by-id "velocity")))
        stories  (js/parseInt (d/value (d/by-id "stories")))]
       (d/set-html! (d/by-id "res")
                    (template/node [:span.no-stories
                                    (cond
                                     (< velocity stories) (str "Velocity is too low to cover " stories " stories.")
                                     :else (str "Can't reach a velocity of " velocity " with " (humanize-number-of-stories stories) "."))]))))


(defn display-estimates []
  (def estimates (estimate (d/value (d/by-id "velocity")) (d/value (d/by-id "stories"))))
  (cond
   (empty? estimates) (display-message)
   :else (d/set-html! (d/by-id "res")
                      (template/node [:div.stories_table
                                      (for [est estimates]
                                        [:div.story
                                         [:img.triangle {:src "/images/triangle.png"}]
                                         [:img.star {:src "/images/star.png"}]
                                         [:span.text (cljs-intro.stories/rand-sentence)]
                                         [:div.estimate est
                                          [:img.start {:src "/images/start.png"}]]])]))))

(event/listen stats-button "click" display-estimates)
(event/listen (d/by-id "velocity") "keyup" display-estimates)
(event/listen (d/by-id "stories") "keyup" display-estimates)
