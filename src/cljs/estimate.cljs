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

(defn clj->js
  "Recursively transforms ClojureScript maps into Javascript objects,
   other ClojureScript colls into JavaScript arrays, and ClojureScript
   keywords into JavaScript strings."
  [x]
  (cond
    (string? x) x
    (keyword? x) (name x)
    (map? x) (.strobj (reduce (fn [m [k v]]
               (assoc m (clj->js k) (clj->js v))) {} x))
    (coll? x) (apply array (map clj->js x))
    :else x))

(event/listen
  stats-button
  "click"
  (fn []
    (def estimates (estimate (d/value (d/by-id "velocity")) (d/value (d/by-id "stories"))))
    (d/set-html! (d/by-id "res")
      (template/node [:div.stories_table
        (for [est estimates]
          [:div.story
            [:img.triangle {:src "/images/triangle.png"}]
            [:img.star {:src "/images/star.png"}]
            [:span.text (cljs-intro.stories/rand-sentence)]
            [:div.estimate est
              [:img.start {:src "/images/start.png"}]]
          ])
      ]))))