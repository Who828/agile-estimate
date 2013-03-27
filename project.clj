(defproject cljs-intro "1.0.0-SNAPSHOT"
  :description "FIXME: write description"
  :dependencies [[org.clojure/clojure "1.4.0"]
  [domina "1.0.0"]
  [org.clojure/google-closure-library-third-party "0.0-2029"]]
  :plugins [[lein-cljsbuild "0.2.3"]]
  :source-path "src/clj"
  :main cljs-intro.core
  :cljsbuild {
    :builds [{
      :source-path "src/cljs"
      :compiler {
        :output-to "resources/public/estimate.js"
        :optimization :advanced
        :pretty-print true
        }}]})
